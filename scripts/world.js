import * as THREE from 'three';
import { WorldChunk } from './worldChunk';

export class World extends THREE.Group {

  /**
   * Whether or not we want to load the chunks asynchronously
   */
  asyncLoading = true;

  /**
   * The number of chunks to render around the player.
   * When this is set to 0, the chunk the player is on
   * is the only one that is rendered. If it is set to 1,
   * the adjaccent chunks are rendered; if set to 2, the
   * chunks adjacent to those are rendered, and so on.
   */

  drawDistance = 3;

  chunkSize = {
    width: 64,
    height: 32
  };

  params = {
    seed: 0,
    terrain: {
      scale: 30,
      magnitude: 0.2,
      offset: 0.25,
    }
  };

  constructor(seed = 0) {
    super();
    this.seed = seed;
  }

  generate() {
    this.disposeChunks();

    for (let x = -this.drawDistance; x <= this.drawDistance; x++) {
      for (let z = -this.drawDistance; z <= this.drawDistance; z++) {
        const chunk = new WorldChunk(this.chunkSize, this.params);
        chunk.position.set(x * this.chunkSize.width, 0, z * this.chunkSize.width);
        chunk.userData = { x, z };
        chunk.generate();
        this.add(chunk);
      }
    }
  }

  update(player) {
    const visibleChunks = this.getVisivleChunks(player);
    const chunkToAdd = this.getChunksToAdd(visibleChunks);
    this.removeUnusedChunks(visibleChunks);

    for (const chunk of chunkToAdd) {
      this.generateChunk(chunk.x, chunk.z);
    }
  }

  getVisivleChunks(player) {
    const visibleChunks = [];

    const coords = this.worldToChunkCoords(
      player.position.x,
      player.position.y - (player.height / 2),
      player.position.z
    );

    const chunkX = coords.chunk.x;
    const chunkZ = coords.chunk.z;

    for(let x = chunkX - this.drawDistance; x <= chunkX + this.drawDistance; x++) {
      for(let z = chunkZ - this.drawDistance; z <= chunkZ + this.drawDistance; z++) {
        visibleChunks.push({x, z});
      }
    }

    return visibleChunks;
  }

  getChunksToAdd(visibleChunks) {
    // Filter down the visible chunks to those not already in the world
    return visibleChunks.filter((chunk) => {
      const chunkExists = this.children
        .map((obj) => obj.userData)
        .find(({x, z}) => (
          chunk.x === x && chunk.z === z
        ));

      return !chunkExists;
    })
  }

  removeUnusedChunks(visibleChunks) {
    // Filter down the visible chunks to those not already in the world
    const chunksToRemove = this.children.filter((chunk) => {
      const { x, z } = chunk.userData;
      const chunkExists = visibleChunks
        .find((visibleChunks) => (
          visibleChunks.x === x && visibleChunks.z === z
        ));

      return !chunkExists;
    });

    for (const chunk of chunksToRemove) {
      chunk.disposeInstances();
      this.remove(chunk);
      console.log(`Removing chunk at X: ${chunk.userData.x} Z: ${chunk.userData.z}`);
    }
  }

  generateChunk(x, z) {
    const chunk = new WorldChunk(this.chunkSize, this.params);
        chunk.position.set(x * this.chunkSize.width, 0, z * this.chunkSize.width);
        chunk.userData = { x, z };

        if (this.asyncLoading) {
          // Load chunk asynchronously
          requestIdleCallback(chunk.generate.bind(chunk), { timeout: 1000 });
        } else {
          chunk.generate();
        }
        this.add(chunk);
        console.log(`Adding chunk at X: ${chunk.userData.x} Z: ${chunk.userData.z}`);
  }

  getBlock(x, y, z) {
    const coords = this.worldToChunkCoords(x, y, z);
    const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);

    if (chunk && chunk.loaded) {
      return chunk.getBlock(
        coords.block.x,
        coords.block.y,
        coords.block.z
      );
    } else {
      return null;
    }
  }

  worldToChunkCoords(x, y, z) {
    const chunkCoords = {
      x: Math.floor(x / this.chunkSize.width),
      z: Math.floor(z / this.chunkSize.width)
    };

    const blockCoords = {
      x: x - this.chunkSize.width * chunkCoords.x,
      y,
      z: z - this.chunkSize.width * chunkCoords.z
    };

    return {
      chunk: chunkCoords,
      block: blockCoords
    }
  }

  getChunk(chunkX, chunkZ) {
    return this.children.find((chunk) => (
      chunk.userData.x === chunkX &&
      chunk.userData.z === chunkZ
    ));
  }

  disposeChunks() {
    this.traverse((chunk) => {
      if (chunk.disposeInstances) {
        chunk.disposeInstances();
      }
    });
    this.clear();
  }

  /**
   * Adds a new block at (x, y, z) of type 'blockId'
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @param {number} blockId
   */
  addBlock(x, y, z, blockId) {
    const coords = this.worldToChunkCoords(x, y, z);
    const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);

    if (chunk) {
      chunk.addBlock(coords.block.x, coords.block.y, coords.block.z, blockId);

      this.revealBlock(x - 1, y, z);
      this.revealBlock(x + 1, y, z);
      this.revealBlock(x, y - 1, z);
      this.revealBlock(x, y + 1, z);
      this.revealBlock(x, y, z - 1);
      this.revealBlock(x, y, z + 1);
    }
  }

  /**
   * Removes the block at (x, y, z) and sets it ti empty
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */
  removeBlock(x, y, z) {
    const coords = this.worldToChunkCoords(x, y, z);
    const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);
  
    // Don't allow removing the first layer of blocks
    // if (coords.block.y === 0) return;

    if (chunk) {
      chunk.removeBlock(coords.block.x, coords.block.y, coords.block.z);

      // Reveal any adjacent blocks that may have been exposed after the block at (x,y,z) was removed
      this.hideBlock(x - 1, y, z);
      this.hideBlock(x + 1, y, z);
      this.hideBlock(x, y - 1, z);
      this.hideBlock(x, y + 1, z);
      this.hideBlock(x, y, z - 1);
      this.hideBlock(x, y, z + 1);
    }
  }

  /**
   * Reveals the block at (x, y, z) by adding a new mesh instance
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */
  revealBlock(x, y, z) {
    const coords = this.worldToChunkCoords(x, y, z);
    const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);

    if (chunk) {
      chunk.addBlockInstance(coords.block.x, coords.block.y, coords.block.z);
    }
  }

  /**
   * Hides the block at (x, y, z) by removing the mesh instance
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */
  hideBlock(x, y, z) {
    const coords = this.worldToChunkCoords(x, y, z);
    const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);

    if (chunk && chunk.isBlockObscured(coords.block.x, coords.block.y, coords.block.z)) {
      chunk.deleteBlockInstance(coords.block.x, coords.block.y, coords.block.z);
    }
  }
}