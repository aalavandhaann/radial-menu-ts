/**
 * inspired from https://github.com/axln/radial-menu-js
*/
const DEFAULT_SIZE: number = 100;
const DEFAULT_RADIUS: number = 50;
const MINIMUM_SECTIONS: number = 6;

export interface RadialMenuParams{
    parent: RadialMenu[];
}

export class RadialMenu{
    protected _size: number = DEFAULT_SIZE;
    protected _radius: number = DEFAULT_RADIUS;

    protected _params: RadialMenuParams;

    constructor(params: RadialMenuParams){
        this._params = params;
    }
}