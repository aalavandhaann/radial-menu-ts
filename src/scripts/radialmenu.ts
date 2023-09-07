import { EventDispatcher, MathUtils, Vector2 } from "three";

/**
 * inspired from https://github.com/axln/radial-menu-js
*/
export const DEFAULT_SIZE: number = 100;
export const DEFAULT_RADIUS: number = 50;
export const MINIMUM_SECTORS: number = 6;
export const EVENT_RADIAL_ITEM_CLICK: string = 'RADIAL_ITEM_CLICK_EVENT';
export const EVENT_RADIAL_MENU_CLOSE: string = 'RADIAL_MENU_CLOSE_EVENT';
export const EVENT_RADIAL_MENU_OPEN: string = 'RADIAL_MENU_OPEN_EVENT';
export const EVENT_RADIAL_MENU_RETURN: string = 'RADIAL_MENU_RETURN_EVENT';

export class RadialMenuEvent {
    protected _type: string;
    protected _target: any;
    protected _item: IRadialMenuItem | null;
    protected _index: number;

    constructor(type: string, target: any, item: IRadialMenuItem | null, index: number) {
        this._type = type;
        this._target = target;
        this._item = item;
        this._index = index;
    }

    public get type(): string {
        return this._type;
    }

    public get target(): any {
        return this._target;
    }

    public set target(tgt: any) {
        this._target = tgt;
    }

    public get item(): IRadialMenuItem | null{
        return this._item;
    }

    public get index(): number {
        return this._index;
    }
}

export interface IRadialMenuItem {
    id: string,
    title: string | null,
    cssIconClass: string | null,
    items: IRadialMenuItem[] | null,
}

export interface IRadialMenuParams {
    [key: string]: string | number | any;
    parent: HTMLElement;
    size: number;
    radius: number;
    closeOnClick: boolean;
    items: IRadialMenuItem[];
}



export class RadialMenu extends EventDispatcher {
    protected _size: number = DEFAULT_SIZE;
    protected _radius: number = DEFAULT_RADIUS;
    protected _innerRadius: number;
    protected _sectorSpace: number;
    protected _sectorCount: number;
    protected _scale: number = 1;

    protected _holder: HTMLElement;
    protected _parent: HTMLElement;

    protected _svgElement: SVGSVGElement;
    protected _currentMenu: SVGSVGElement | null = null;
    protected _parentMenu: SVGSVGElement[] = [];

    protected _items: IRadialMenuItem[];
    protected _levelItems: IRadialMenuItem[];
    protected _parentItems: IRadialMenuItem[][] = [];


    protected _params: IRadialMenuParams = {
        parent: document.body,
        size: DEFAULT_SIZE,
        radius: DEFAULT_RADIUS,
        closeOnClick: true,
        items: [
            {
                id: 'one',
                title: null,
                cssIconClass: null,
                items: null,
            }
        ]
    };

    constructor(params: IRadialMenuParams) {
        super();
        Object.keys(this._params).forEach((key: string) => {
            this._params[key] = params[key];
        });

        this._size = this._params.size;
        this._radius = this._params.radius;
        this._parent = this._params.parent;
        this._innerRadius = this._radius * 0.4;
        this._sectorSpace = this._radius * 0.06;
        this._items = this._params.items;
        this._levelItems = this._params.items;
        this._sectorCount = Math.max(this._params.items.length, MINIMUM_SECTORS);

        this._holder = this._createHolder();
        this._svgElement = this._addIconSymbols();

        this._holder.appendChild(this._svgElement);
        this._parent.appendChild(this._holder);

        document.addEventListener('wheel', this._onMouseWheel.bind(this));
        document.addEventListener('keydown', this._onKeyDown.bind(this));
    }

    protected _onKeyDown(event: KeyboardEvent): void {
        if (this._currentMenu) {
            switch (event.key) {
                case 'Escape':
                case 'Backspace':
                    this._handleCenterClick();
                    event.preventDefault();
                    break;
                case 'Enter':
                    this._handleClick();
                    event.preventDefault();
                    break;
                case 'ArrowRight':
                case 'ArrowUp':
                    this._selectDelta(1);
                    event.preventDefault();
                    break;
                case 'ArrowLeft':
                case 'ArrowDown':
                    this._selectDelta(-1);
                    event.preventDefault();
                    break;
            }
        }
    };

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    protected _onMouseWheel(event: WheelEvent): void {
        if (this._currentMenu) {
            let delta: number = -event.deltaY;

            if (delta > 0) {
                this._selectDelta(1)
            } else {
                this._selectDelta(-1)
            }
        }
    };

    protected _selectDelta(indexDelta: number): void {
        var selectedIndex = this._getSelectedIndex();
        if (selectedIndex < 0) {
            selectedIndex = 0;
        }
        selectedIndex += indexDelta;

        if (selectedIndex < 0) {
            selectedIndex = this._levelItems.length + selectedIndex;
        } else if (selectedIndex >= this._levelItems.length) {
            selectedIndex -= this._levelItems.length;
        }
        this._setSelectedIndex(selectedIndex);
    };

    protected _calcScale(): number {
        let totalSpace: number = this._sectorSpace * this._sectorCount;
        let circleLength: number = Math.PI * 2 * this._radius;
        let radiusDelta: number = this._radius - (circleLength - totalSpace) / (Math.PI * 2);
        return (this._radius - radiusDelta) / this._radius;
    }

    protected _resolveLoopIndex(index: number, length: number): number {
        if (index < 0) {
            index = length + index;
        }
        else if (index >= length) {
            index = index - length;
        }
        /**\
         * The original code was returning null but I removed the redudant condition and returning
         * the index itself to avoid ambiguous return type;
         */
        return index;
    }

    protected _getIndexOffset(): number {
        if (this._levelItems.length < this._sectorCount) {
            switch (this._levelItems.length) {
                case 1:
                case 2:
                case 3:
                    return -2;
                default:
                    return -1;
            }
        }
        return -1;
    }

    protected _getPolarCoordinates(angle: number, radius: number): Vector2 {
        return new Vector2(Math.sin(MathUtils.degToRad(angle)) * radius, Math.cos(MathUtils.degToRad(angle)) * radius);
    }

    protected _getSectorCenter(startAngle: number, endAngle: number): Vector2 {
        return this._getPolarCoordinates((startAngle + endAngle) * 0.5, this._innerRadius + (this._radius - this._innerRadius) / 2);
    }

    protected _numberToString(n: number | string): string {
        if (Number.isInteger(n)) {
            return n.toString();
        } else {
            let r: string = (+n).toFixed(5);
            if (r.match(/\./)) {
                r = r.replace(/\.?0+$/, '');
            }
            return r;
        }
    };

    protected _pointToString(point: Vector2): string {
        return `${point.x} ${point.y}`;
    }

    protected _close(): void {
        let parentMenu: SVGSVGElement;
        if (this._currentMenu) {
            while (parentMenu = this._parentMenu.pop()!) {
                parentMenu.remove();
            }
            this._parentItems.length = 0;

            this._setClassAndWaitForTransition(this._currentMenu, 'menu inner').then(() => {
                if (this._currentMenu) {
                    this._currentMenu.remove();
                }
                this._currentMenu = null;
            });
        }        
    };

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    protected _getParentMenu(): SVGSVGElement | null {
        if (this._parentMenu.length > 0) {
            return this._parentMenu[this._parentMenu.length - 1];
        } else {
            return null;
        }
    };

    protected _setClassAndWaitForTransition(node: SVGSVGElement, newClass: string): Promise<unknown> {
        let promiseResolve: any;
        
        function handler(evt: any) {
            if (evt.target == node && evt.propertyName == 'visibility') {
                node.removeEventListener('transitionend', handler);
                if (promiseResolve) {
                    promiseResolve();
                }
            }
        }
        return new Promise((resolve: any) => {
            promiseResolve = resolve;
            node.addEventListener('transitionend', handler);
            node.setAttribute('class', newClass);
        });
    };

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    protected _nextTick(fn: any): void {
        setTimeout(fn, 10);
    };

    protected _showNestedMenu(item: IRadialMenuItem): void {
        let parentMenu: SVGSVGElement | null;
        if (this._currentMenu) {
            this._parentMenu.push(this._currentMenu);
            this._parentItems.push(this._levelItems);
        }

        if (item.items) {
            this._currentMenu = this._createMenu('menu inner', item.items, true);
            this._holder.appendChild(this._currentMenu);
        }


        // wait DOM commands to apply and then set class to allow transition to take effect
        this._nextTick(() => {
            parentMenu = this._getParentMenu();
            if (parentMenu) {
                parentMenu.setAttribute('class', 'menu outer');
            }
            if (this._currentMenu) {
                this._currentMenu.setAttribute('class', 'menu');
            }
        });
    };

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    protected _returnToParentMenu(): void {
        let parentMenu: SVGSVGElement | null = this._getParentMenu();
        if (parentMenu) {
            parentMenu.setAttribute('class', 'menu');
        }

        if (this._currentMenu) {
            this._setClassAndWaitForTransition(this._currentMenu, 'menu inner').then(() => {
                if (this._currentMenu)
                    this._currentMenu.remove();
                this._currentMenu = this._parentMenu.pop()!;
                this._levelItems = this._parentItems.pop()!;
            });
        }

    };

    protected _handleClick(): void {
        let selectedIndex: number = this._getSelectedIndex();
        let item: IRadialMenuItem;
        if (selectedIndex >= 0) {
            item = this._levelItems[selectedIndex];
            if (item.items) {
                this._showNestedMenu(item);
            } else {
                if (this._params.closeOnClick) {
                    this._close();
                }
            }
            this.dispatchEvent(new RadialMenuEvent(EVENT_RADIAL_ITEM_CLICK, this, item, selectedIndex));
        }
    };

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    protected _handleCenterClick(): void {
        
        if (this._parentItems.length > 0) {
            this._returnToParentMenu();
            this.dispatchEvent(new RadialMenuEvent(EVENT_RADIAL_MENU_RETURN, this, null, -1));
        } else {
            this._close();
            this.dispatchEvent(new RadialMenuEvent(EVENT_RADIAL_MENU_CLOSE, this, null, -1));
        }
    };

    protected _createCircle(location: Vector2, radius: number): SVGCircleElement {
        let circle: SVGCircleElement = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', `${location.x}`);
        circle.setAttribute('cy', `${location.y}`);
        circle.setAttribute('r', `${radius}`);
        return circle;
    };

    protected _createText(location: Vector2, title: string): SVGTextElement {
        let text: SVGTextElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('class', 'svg-menu-item-text');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('x', `${location.x}`);
        text.setAttribute('y', `${location.y}`);
        // text.setAttribute('font-size', '15%');
        text.innerHTML = title;
        return text;
    }

    protected _createUseTag(location: Vector2, link: string): SVGUseElement {
        let use: SVGUseElement = document.createElementNS('http://www.w3.org/2000/svg', 'use');
        use.setAttribute('x', `${location.x}`);
        use.setAttribute('y', `${location.y}`);
        use.setAttribute('width', '10');
        use.setAttribute('height', '10');
        use.setAttribute('fill', 'white');
        use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', link);
        return use;
    }

    protected _createCenter(svg: SVGSVGElement, title: string | null, icon: string | null, size: number | null): void {
        var g: SVGGElement = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        let text: SVGTextElement;
        let use: SVGUseElement;
        let centerCircle: SVGCircleElement = this._createCircle(new Vector2(0, 0), this._innerRadius - this._sectorSpace / 3);
        size = size || 8;

        g.appendChild(centerCircle);

        if (title) {
            text = this._createText(new Vector2(0, 0), title);
            g.appendChild(text);
        }

        if (icon) {
            use = this._createUseTag(new Vector2(0, 0), icon);
            use.setAttribute('width', `${size}`);
            use.setAttribute('height', `${size}`);
            use.setAttribute('transform', `translate(${-(size / 2)}, ${-(size / 2)})`);
            g.appendChild(use);
        }

        g.setAttribute('class', 'center');
        
        svg.appendChild(g);
    };

    protected _createSectorCmds(startAngle: number, endAngle: number): string {
        let radiusAfterScale: number = this._radius * (1 / this._scale);
        let radiusDiff: number = this._radius - this._innerRadius;
        let radiusDelta: number = (radiusDiff - (radiusDiff * this._scale)) * 0.5;
        let innerRadius: number = (this._innerRadius + radiusDelta) * (1 / this._scale);
        let initPoint: Vector2 = this._getPolarCoordinates(startAngle, this._radius);
        let path: string = `M ${this._pointToString(initPoint)}`;

        path += 'A' + radiusAfterScale + ' ' + radiusAfterScale + ' 0 0 0' + this._pointToString(this._getPolarCoordinates(endAngle, this._radius));
        path += 'L' + this._pointToString(this._getPolarCoordinates(endAngle, this._innerRadius));
        path += 'A' + innerRadius + ' ' + innerRadius + ' 0 0 1 ' + this._pointToString(this._getPolarCoordinates(startAngle, this._innerRadius));
        path += 'Z';
        return path;
    };

    protected _createHolder(): HTMLElement {
        let holder: HTMLElement = document.createElement('DIV');
        holder.className = 'menuHolder';
        holder.style.width = `${this._size}px`;
        holder.style.height = `${this._size}px`;
        holder.style.top = `${-this._size*0.5}px`;
        holder.style.left = `${-this._size*0.5}px`;
        holder.style.position = 'absolute';
        return holder;
    }

    protected _getSelectedNode(): SVGElement | null {
        let items: HTMLCollectionOf<SVGElement>;
        if (this._currentMenu) {
            items = this._currentMenu.getElementsByClassName('selected') as HTMLCollectionOf<SVGElement>;
            if (items.length > 0) {
                return items[0];
            }
        }
        return null;
    };

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    protected _getSelectedIndex() {
        let selectedNode: SVGElement | null = this._getSelectedNode();
        let selectedIndex: number;
        if (selectedNode) {
            selectedIndex = parseInt(selectedNode.getAttribute('data-index') || '!@#!@');
            return (!isNaN(selectedIndex)) ? selectedIndex : -1;
        } else {
            return -1;
        }
    };

    protected _setSelectedIndex(index: number): void {
        let items: NodeListOf<SVGGElement>;
        let itemToSelect: SVGGElement;
        let selectedNode: SVGElement | null;
        if (index >= 0 && index < this._levelItems.length && this._currentMenu) {
            items = this._currentMenu.querySelectorAll('g[data-index="' + index + '"]');
            if (items.length) {
                itemToSelect = items[0];
                selectedNode = this._getSelectedNode();
                if (selectedNode) {
                    selectedNode.setAttribute('class', 'sector');
                }
                itemToSelect.setAttribute('class', 'sector selected');
            }
        }
    }

    protected _appendSectorPath(startAngle: number, endAngle: number, svg: SVGSVGElement, item: IRadialMenuItem | null, index: number): void {
        let g: SVGElement = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        let path: SVGPathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        let text: SVGTextElement;
        let use: SVGUseElement;

        let centerPoint: Vector2 = this._getSectorCenter(startAngle, endAngle);
        let translate: Vector2 = new Vector2((1 - this._scale) * centerPoint.x, (1 - this._scale) * centerPoint.y);
        g.appendChild(path);
        if (item) {
            if (item.title) {
                text = this._createText(centerPoint, item.title);
                if (item.cssIconClass) {
                    text.setAttribute('transform', 'translate(0, 8)');
                }
                else {
                    text.setAttribute('transform', 'translate(0, 2)');
                }
                g.appendChild(text);
            }
            if (item.cssIconClass) {
                use = this._createUseTag(centerPoint, item.cssIconClass);
                if (item.title) {
                    use.setAttribute('transform', 'translate(-5,-8)');
                } else {
                    use.setAttribute('transform', 'translate(-5,-5)');
                }
                g.appendChild(use);
            }

            g.setAttribute('class', 'sector');
            if (!index) {
                g.classList.add('selected');
            }
            g.setAttribute('data-id', item.id);
            g.setAttribute('data-index', `${index}`);

        }
        else {
            g.setAttribute('class', 'dummy');
        }

        path.setAttribute('d', this._createSectorCmds(startAngle, endAngle));
        g.setAttribute('transform', `translate(${translate.x}, ${translate.y}) scale(${this._scale})`);
        
        if(item){
            svg.appendChild(g);            
        }
        // svg.appendChild(g);
    }

    protected _createMenu(classValue: string, levelItems: IRadialMenuItem[], nested?: boolean): SVGSVGElement {
        let i: number;
        let parentNode: SVGElement | null;
        let svg: SVGSVGElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        let angleStep: number;
        let angleShift: number;
        let indexOffset: number;

        let startAngle: number;
        let endAngle: number;
        let itemIndex: number;

        let item: IRadialMenuItem | null = null;

        this._levelItems = levelItems;
        this._sectorCount = Math.max(this._levelItems.length, MINIMUM_SECTORS);
        this._scale = this._calcScale();

        angleStep = 360.0 / this._sectorCount;
        angleShift = angleStep / 2 + 270.0;
        indexOffset = this._getIndexOffset();

        for (i = 0; i < this._sectorCount; i++) {
            startAngle = angleShift + angleStep * i;
            endAngle = angleShift + angleStep * (i + 1);
            itemIndex = this._resolveLoopIndex(this._sectorCount - i + indexOffset, this._sectorCount);
            if (itemIndex >= 0 && itemIndex < this._levelItems.length) {
                item = this._levelItems[itemIndex];
            }
            else {
                item = null;
            }
            this._appendSectorPath(startAngle, endAngle, svg, item, itemIndex);
        }

        if (nested) {
            this._createCenter(svg, null, '#return', 8);
        } else {
            this._createCenter(svg, null, '#close', 7);
        }

        svg.addEventListener('pointerdown', (evt: PointerEvent) => {
            parentNode = ((evt.target as SVGElement).parentNode as SVGElement) || null;
            if (parentNode && parentNode.classList.contains('sector')) {
                itemIndex = parseInt(parentNode.getAttribute('data-index') || '!@#!@');
                if (!isNaN(itemIndex)) {
                    this._setSelectedIndex(itemIndex);
                }
            }
            evt.stopImmediatePropagation();
        }, { passive: true });

        svg.addEventListener('click', (evt: MouseEvent) => {
            parentNode = ((evt.target as SVGElement).parentNode as SVGElement) || null;
            if (parentNode) {
                if (parentNode.classList.contains('sector')) {
                    this._handleClick();
                }
                else if (parentNode.classList.contains('center')) {
                    this._handleCenterClick();
                }
            }
            evt.stopImmediatePropagation();
        }, { passive: true });

        svg.setAttribute('class', classValue);
        svg.setAttribute('viewBox', '-50 -50 100 100');
        svg.setAttribute('width', `${this._size}`);
        svg.setAttribute('height', `${this._size}`);
        return svg;
    }

    protected _addIconSymbols(): SVGSVGElement {
        let svg: SVGSVGElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        let returnSymbol: SVGSymbolElement = document.createElementNS('http://www.w3.org/2000/svg', 'symbol');
        let returnPath: SVGPathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        let closeSymbol: SVGSymbolElement = document.createElementNS('http://www.w3.org/2000/svg', 'symbol');
        let closePath: SVGPathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');

        returnPath.setAttribute('d', "M375.789,92.867H166.864l17.507-42.795c3.724-9.132,1-19.574-6.691-25.744c-7.701-6.166-18.538-6.508-26.639-0.879" +
            "L9.574,121.71c-6.197,4.304-9.795,11.457-9.563,18.995c0.231,7.533,4.261,14.446,10.71,18.359l147.925,89.823" +
            "c8.417,5.108,19.18,4.093,26.481-2.499c7.312-6.591,9.427-17.312,5.219-26.202l-19.443-41.132h204.886" +
            "c15.119,0,27.418,12.536,27.418,27.654v149.852c0,15.118-12.299,27.19-27.418,27.19h-226.74c-20.226,0-36.623,16.396-36.623,36.622" +
            "v12.942c0,20.228,16.397,36.624,36.623,36.624h226.74c62.642,0,113.604-50.732,113.604-113.379V206.709" +
            "C489.395,144.062,438.431,92.867,375.789,92.867z");

        closeSymbol.setAttribute('id', 'close');
        closeSymbol.setAttribute('viewBox', '0 0 41.756 41.756');

        closePath.setAttribute('d', "M27.948,20.878L40.291,8.536c1.953-1.953,1.953-5.119,0-7.071c-1.951-1.952-5.119-1.952-7.07,0L20.878,13.809L8.535,1.465" +
            "c-1.951-1.952-5.119-1.952-7.07,0c-1.953,1.953-1.953,5.119,0,7.071l12.342,12.342L1.465,33.22c-1.953,1.953-1.953,5.119,0,7.071" +
            "C2.44,41.268,3.721,41.755,5,41.755c1.278,0,2.56-0.487,3.535-1.464l12.343-12.342l12.343,12.343" +
            "c0.976,0.977,2.256,1.464,3.535,1.464s2.56-0.487,3.535-1.464c1.953-1.953,1.953-5.119,0-7.071L27.948,20.878z");

        svg.setAttribute('class', 'icons');
        returnSymbol.setAttribute('id', 'return');
        returnSymbol.setAttribute('viewBox', '0 0 489.394 489.394');

        returnSymbol.appendChild(returnPath);
        svg.appendChild(returnSymbol);
        closeSymbol.appendChild(closePath);
        svg.appendChild(closeSymbol);

        return svg;
    }

    public open(level?: number[] | null): void {
        level = (!level) ? null : level;
        let items: IRadialMenuItem[] = this._items;
        let isNested: boolean = (level) ? true : false;
        if(level){
            for (let i: number=0; i < level.length; i++){
                let innerItems: IRadialMenuItem[] | null = items[level[i]].items;
                if(innerItems){
                    items = innerItems;
                }   
            }
        }
        if (!this._currentMenu) {

            this._currentMenu = this._createMenu('menu inner', items, isNested);
            this._holder.appendChild(this._currentMenu);

            // wait DOM commands to apply and then set class to allow transition to take effect
            this._nextTick(() => {
                if (this._currentMenu) {
                    this._currentMenu.setAttribute('class', 'menu');
                }
            });
            this.dispatchEvent(new RadialMenuEvent(EVENT_RADIAL_MENU_OPEN, this, null, -1));
        }
    }

    public close() {

        if (this._currentMenu) {
            var parentMenu;
            while (parentMenu = this._parentMenu.pop()) {
                parentMenu.remove();
            }
            this._parentItems.length = 0;

            this._setClassAndWaitForTransition(this._currentMenu, 'menu inner').then(() => {
                if (this._currentMenu) {
                    this._currentMenu.remove();
                }
                this._currentMenu = null;
            });
        }
    };
}