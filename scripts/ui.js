import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

export function createUI(world) {
  const gui = new GUI();
  
  gui.add(world.size, 'width', 8, 128, 1).name('Width');
  gui.add(world.size, 'height', 8, 64, 1).name('height');

  const terrainFolder = gui.addFolder('Terrain');
  terrainFolder.add(world.params, 'seed', 0,10000).name('Seed');
  terrainFolder.add(world.params.terrain, 'scale', 10, 100).name('Scale');
  terrainFolder.add(world.params.terrain,'magnitude', 0, 1).name('Magnitude');
  terrainFolder.add(world.params.terrain, 'offset', 0, 1).name('Offset');

  gui.onChange(() => {
    world.generate();
  })
}