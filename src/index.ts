'use strict';

import { DEFAULT_RADIUS, EVENT_RADIAL_ITEM_CLICK, IRadialMenuItem, RadialMenu, RadialMenuEvent } from "./scripts/radialmenu";
let menuItems:IRadialMenuItem[] = [
    {
        id   : 'draw',
        title: 'Draw',
        cssIconClass: '#pencil',
        items: null,
    },
    {
        id   : 'move',
        title: 'Edit',
        cssIconClass: '#move',
        items: null,
    },
    {
        id   : 'lights',
        title: 'Lights',
        cssIconClass: '#lights',
        items: null,
    },
    {
        id   : 'sunlight',
        title: 'Sunlight',
        cssIconClass: '#sunlight',
        items: null,
    },
    {
        id   : 'floorpaint',
        title: 'Floor',
        cssIconClass: '#wallpaint',
        items: null,
    },
    {
        id   : 'furniture',
        title: 'Furnish',
        cssIconClass: '#furniture',
        items: null,
    },
    {
        id   : 'wallpaint',
        title: 'Wall',
        cssIconClass: '#wallpaint',
        items: [
            {
                id   : 'draw',
                title: 'Draw',
                cssIconClass: '#pencil',
                items: null,
            },
            {
                id   : 'move',
                title: 'Edit',
                cssIconClass: '#move',
                items: null,
            },
            {
                id   : 'lights',
                title: 'Lights',
                cssIconClass: '#lights',
                items: null,
            },
            {
                id   : 'sunlight',
                title: 'Sunlight',
                cssIconClass: '#sunlight',
                items: null,
            },
            {
                id   : 'floorpaint',
                title: 'Floor',
                cssIconClass: '#wallpaint',
                items: null,
            },
            {
                id   : 'furniture',
                title: 'Furnish',
                cssIconClass: '#furniture',
                items: null,
            }
        ],
    },
    
];
// let menuItems:IRadialMenuItem[] = [
//     {
//         id   : 'walk',
//         title: 'Walk',
//         cssIconClass: '#walk',
//         items: null,
//     },
//     {
//         id   : 'run',
//         title: 'Run',
//         cssIconClass: '#run',
//         items: null,
//     },
//     {
//         id   : 'drive',
//         title: 'Drive',
//         cssIconClass: '#drive',
//         items: null,
//     },
//     {
//         id   : 'pencil',
//         title: 'Draw',
//         cssIconClass: '#pencil',
//         items: null,
//     },
//     {
//         id   : 'more',
//         title: 'More...',
//         cssIconClass: '#more',
//         items: [
//             {
//                 id   : 'eat',
//                 title: 'Eat',
//                 cssIconClass: '#eat',
//                 items: null,
//             },
//             {
//                 id   : 'sleep',
//                 title: 'Sleep',
//                 cssIconClass: '#sleep',
//                 items: null,
//             },
//             {
//                 id   : 'shower',
//                 title: 'Take Shower',
//                 cssIconClass: '#shower',
//                 items: null,
//             },
//             {
//                 id   : 'workout',
//                 cssIconClass: '#workout',
//                 title: 'Work Out',
//                 items: null,
//             }
//         ]
//     },
//     {
//         id: 'weapon',
//         title: 'Weapon...',
//         cssIconClass: '#weapon',
//         items: [
//             {
//                 id: 'firearm',
//                 cssIconClass: '#firearm',
//                 title: 'Firearm...',
//                 items: [
//                     {
//                         id: 'glock',
//                         cssIconClass: null,
//                         title: 'Glock 22',
//                         items: null,
//                     },
//                     {
//                         id: 'beretta',
//                         cssIconClass: null,
//                         title: 'Beretta M9',
//                         items: null,
//                     },
//                     {
//                         id: 'tt',
//                         cssIconClass: null,
//                         title: 'TT',
//                         items: null,
//                     },
//                     {
//                         id: 'm16',
//                         cssIconClass: null,
//                         title: 'M16 A2',
//                         items: null,
//                     },
//                     {
//                         id: 'ak47',
//                         cssIconClass: null,
//                         title: 'AK 47',
//                         items: null,
//                     }
//                 ]
//             },
//             {
//                 id: 'knife',
//                 cssIconClass: '#knife',
//                 title: 'Knife',
//                 items: null,
//             },
//             {
//                 id: 'machete',
//                 cssIconClass: '#machete',
//                 title: 'Machete',
//                 items: null,
//             }, {
//                 id: 'grenade',
//                 cssIconClass: '#grenade',
//                 title: 'Grenade',
//                 items: null,
//             }
//         ]
//     }
// ];

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
window.onload = function () {
    let svgMenu: RadialMenu = new RadialMenu(
        {
            parent: document.body,
            size: 300,
            closeOnClick: false,
            items : menuItems,
            radius: DEFAULT_RADIUS,
        });

    var openMenu = document.getElementById('openMenu')!;
    openMenu.onclick = function () {
        svgMenu.open();
    };

    var closeMenu = document.getElementById('closeMenu')!;
    closeMenu.onclick = function () {
        svgMenu.close();
    };

    svgMenu.addEventListener(EVENT_RADIAL_ITEM_CLICK, (evt: any)=>{
        console.log((evt as RadialMenuEvent).item);
    });
};