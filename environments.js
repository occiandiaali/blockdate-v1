/* =========================================================================
   VOXEL LOVE - WORLD GENERATOR MODULE (environments.js)
   ========================================================================= */

function generateWorld(worldType) {
  // Clear any existing world objects from scene
  if (window.worldBlocks) {
    window.worldBlocks.forEach((b) => scene.remove(b));
  }
  if (window.videoOrbGroup) {
    scene.remove(window.videoOrbGroup);
  }

  window.worldBlocks = [];
  window.solidObstacles = [];

  if (worldType === "diner") {
    generateDinerWorld();
  } else if (worldType === "park") {
    generateParkWorld();
  } else {
    generateVoxelWorld();
  }
}

// -------------------------------------------------------------------------
// ENVIRONMENT A: PICNIC PARK & PLAYGROUND
// -------------------------------------------------------------------------
function generateParkWorld() {
  const boxGeo = new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
  const halfSize = Math.floor(WORLD_SIZE / 2);

  for (let x = -halfSize; x < halfSize; x++) {
    for (let z = -halfSize; z < halfSize; z++) {
      let yHeight = 0; // Baseline floor height (top at y=0.5)

      // 1. Sunken Pond Feature at (-6, -4)
      const distToPond = Math.hypot(x + 6, z + 4);
      if (distToPond < 3.5) {
        yHeight = -1; // Sunken below baseline
      }
      // 2. Elevated Picnic Hill at (7, 5)
      else if (x >= 4 && x <= 10 && z >= 2 && z <= 8) {
        yHeight = 1; // Tier 1 elevation
        if (x >= 6 && x <= 8 && z >= 4 && z <= 6) {
          yHeight = 2; // Tier 2 peak
        }
      }
      // 3. Playground Dirt Pit at (-5, 6)
      else if (x >= -8 && x <= -2 && z >= 4 && z <= 8) {
        yHeight = -1;
      }

      // Material assignment
      let mat = materials.grass;
      if (yHeight === -1 && distToPond < 3.5) {
        mat = materials.water;
      } else if (yHeight === -1) {
        mat = materials.dirt;
      } else if (yHeight === 2) {
        mat = materials.stone;
      }

      const block = new THREE.Mesh(boxGeo, mat);
      block.position.set(x, yHeight, z);
      block.receiveShadow = true;
      scene.add(block);
      worldBlocks.push(block);

      // Add to solid obstacles if raised above starting ground level
      if (yHeight > 0) {
        solidObstacles.push(block);
      }

      // Fill underneath gaps
      for (let dy = yHeight - 1; dy >= -3; dy--) {
        const fillBlock = new THREE.Mesh(boxGeo, materials.dirt);
        fillBlock.position.set(x, dy, z);
        scene.add(fillBlock);
        worldBlocks.push(fillBlock);
      }

      // Outer Boundary Walls
      if (Math.abs(x) === halfSize - 1 || Math.abs(z) === halfSize - 1) {
        const borderWall = new THREE.Mesh(boxGeo, materials.wood);
        borderWall.position.set(x, yHeight + 1, z);
        scene.add(borderWall);
        worldBlocks.push(borderWall);
        solidObstacles.push(borderWall);
      }
    }
  }

  // Playground Stepping Ledges
  const steps = [
    { x: -5, y: 0, z: 3 },
    { x: -5, y: 1, z: 2 },
    { x: -5, y: 2, z: 1 },
  ];
  steps.forEach((c) => {
    const step = new THREE.Mesh(boxGeo, materials.wood);
    step.position.set(c.x, c.y, c.z);
    step.castShadow = true;
    scene.add(step);
    worldBlocks.push(step);
    solidObstacles.push(step);
  });

  // Benches
  createParkBench(6, 1.5, 4);

  // Heart Monument & Video Orb
  const heartBlock = new THREE.Mesh(boxGeo, materials.heartBlock);
  heartBlock.position.set(0, 2, -6);
  scene.add(heartBlock);
  worldBlocks.push(heartBlock);
  solidObstacles.push(heartBlock);

  createVideoOrb(0, 1.5, -2);

  generateParkNPCs();
}

// -------------------------------------------------------------------------
// ENVIRONMENT B: RETRO COZY DINER
// -------------------------------------------------------------------------
function generateDinerWorld() {
  const boxGeo = new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
  const halfSize = Math.floor(WORLD_SIZE / 2);

  const tileLight = new THREE.MeshStandardMaterial({
    map: createVoxelTexture("#f8fafc"),
    roughness: 0.3,
  });
  const tileDark = new THREE.MeshStandardMaterial({
    map: createVoxelTexture("#0f172a"),
    roughness: 0.3,
  });
  const boothMat = new THREE.MeshStandardMaterial({
    map: createVoxelTexture("#dc2626"),
    roughness: 0.5,
  });
  const counterMat = new THREE.MeshStandardMaterial({
    map: createVoxelTexture("#38bdf8"),
    roughness: 0.2,
  });

  for (let x = -halfSize; x < halfSize; x++) {
    for (let z = -halfSize; z < halfSize; z++) {
      let yHeight = 0;

      // Sunken Central Lounge Pit
      if (x >= -4 && x <= 4 && z >= -2 && z <= 4) {
        yHeight = -1;
      }
      // Elevated VIP Booth Platforms
      else if (x <= -8 || x >= 8) {
        yHeight = 1;
      }

      const isEven = (Math.abs(x) + Math.abs(z)) % 2 === 0;
      const floorBlock = new THREE.Mesh(boxGeo, isEven ? tileLight : tileDark);
      floorBlock.position.set(x, yHeight, z);
      floorBlock.receiveShadow = true;
      scene.add(floorBlock);
      worldBlocks.push(floorBlock);

      if (yHeight > 0) {
        solidObstacles.push(floorBlock);
      }

      for (let dy = yHeight - 1; dy >= -3; dy--) {
        const fill = new THREE.Mesh(boxGeo, materials.dirt);
        fill.position.set(x, dy, z);
        scene.add(fill);
        worldBlocks.push(fill);
      }

      if (Math.abs(x) === halfSize - 1 || Math.abs(z) === halfSize - 1) {
        const wall = new THREE.Mesh(boxGeo, materials.wood);
        wall.position.set(x, yHeight + 1, z);
        scene.add(wall);
        worldBlocks.push(wall);
        solidObstacles.push(wall);
      }
    }
  }

  // Diner Counter
  for (let x = -3; x <= 3; x++) {
    const counter = new THREE.Mesh(boxGeo, counterMat);
    counter.position.set(x, 1, -8);
    counter.castShadow = true;
    scene.add(counter);
    worldBlocks.push(counter);
    solidObstacles.push(counter);
  }

  // Diner Booth
  for (let x = -6; x <= 3; x++) {
    const booth = new THREE.Mesh(boxGeo, boothMat);
    booth.position.set(x, 1, -8);
    booth.castShadow = true;
    scene.add(booth);
    worldBlocks.push(booth);
    solidObstacles.push(booth);
  }

  // Heart & Video Orb
  const heartBlock = new THREE.Mesh(boxGeo, materials.heartBlock);
  heartBlock.position.set(0, 2, -8);
  scene.add(heartBlock);
  worldBlocks.push(heartBlock);
  solidObstacles.push(heartBlock);

  createVideoOrb(0, 0.5, -4);

  generateDinerNPCs();
}

function createParkBench(x, y, z) {
  const boxGeo = new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
  const bench = new THREE.Mesh(boxGeo, materials.wood);
  bench.scale.set(1.5, 0.5, 0.8);
  bench.position.set(x, y + 0.25, z);
  bench.castShadow = true;
  scene.add(bench);
  worldBlocks.push(bench);
  solidObstacles.push(bench);
}

/* =========================================================================
   NPC GENERATORS FOR PARKS & DINERS
   ========================================================================= */

// Generic Voxel NPC Mesh Builder
function createNPCMesh(shirtColorHex, skinColorHex = "#fde047") {
  const group = new THREE.Group();
  const boxGeo = new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);

  const shirtMat = new THREE.MeshStandardMaterial({
    map: createVoxelTexture(shirtColorHex),
    roughness: 0.5,
  });
  const skinMat = new THREE.MeshStandardMaterial({
    map: createVoxelTexture(skinColorHex),
    roughness: 0.6,
  });
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });

  // Head
  const head = new THREE.Mesh(boxGeo, skinMat);
  head.scale.set(0.6, 0.6, 0.6);
  head.position.y = 1.3;
  head.castShadow = true;
  group.add(head);

  // Eyes
  const eyeL = new THREE.Mesh(boxGeo, eyeMat);
  eyeL.scale.set(0.1, 0.12, 0.05);
  eyeL.position.set(-0.15, 1.35, 0.31);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.15;
  group.add(eyeL);
  group.add(eyeR);

  // Torso
  const torso = new THREE.Mesh(boxGeo, shirtMat);
  torso.scale.set(0.6, 0.7, 0.35);
  torso.position.y = 0.65;
  torso.castShadow = true;
  group.add(torso);

  // Arms & Legs
  const armGeo = new THREE.BoxGeometry(0.2, 0.6, 0.2);
  const legGeo = new THREE.BoxGeometry(0.22, 0.5, 0.22);

  const leftArm = new THREE.Mesh(armGeo, shirtMat);
  leftArm.position.set(-0.42, 0.65, 0);
  const rightArm = new THREE.Mesh(armGeo, shirtMat);
  rightArm.position.set(0.42, 0.65, 0);
  group.add(leftArm);
  group.add(rightArm);

  const leftLeg = new THREE.Mesh(legGeo, shirtMat);
  leftLeg.position.set(-0.15, 0.25, 0);
  const rightLeg = new THREE.Mesh(legGeo, shirtMat);
  rightLeg.position.set(0.15, 0.25, 0);
  group.add(leftLeg);
  group.add(rightLeg);

  return group;
}

// -------------------------------------------------------------------------
// PARK NPCs: Bench Visitor & Voxel Puppy
// -------------------------------------------------------------------------
function generateParkNPCs() {
  //console.log("Generating Park NPCs...");

  // 1. Friendly Park Visitor sitting at (x: 8, z: 6)
  const visitorNPC = createNPCMesh("#0ea5e9"); // Sky Blue Shirt
  visitorNPC.position.set(8, 1.5, 6);
  visitorNPC.rotation.y = -Math.PI / 2;
  scene.add(visitorNPC);
  worldBlocks.push(visitorNPC);
  solidObstacles.push(visitorNPC);

  // 2. Voxel Dog near the pond at (x: -4, z: -2)
  const dogGroup = new THREE.Group();
  const dogMat = new THREE.MeshStandardMaterial({
    map: createVoxelTexture("#b45309"),
  });
  const boxGeo = new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);

  const body = new THREE.Mesh(boxGeo, dogMat);
  body.scale.set(0.5, 0.4, 0.7);
  body.position.set(0, 0.3, 0);

  const head = new THREE.Mesh(boxGeo, dogMat);
  head.scale.set(0.35, 0.35, 0.35);
  head.position.set(0, 0.55, 0.35);

  dogGroup.add(body);
  dogGroup.add(head);
  dogGroup.position.set(-4, 0.5, -2);
  dogGroup.rotation.y = Math.PI / 4;
  scene.add(dogGroup);

  worldBlocks.push(dogGroup);
  solidObstacles.push(dogGroup);
}

// -------------------------------------------------------------------------
// DINER NPCs: Chef behind the bar counter & Waiter
// -------------------------------------------------------------------------
function generateDinerNPCs() {
  //  console.log("Generating Diner NPCs...");

  // 1. Chef NPC behind the serving counter (x: 0, z: -7)
  const chefNPC = createNPCMesh("#f8fafc"); // White Chef Uniform
  chefNPC.position.set(0, 1.0, -7);
  chefNPC.rotation.y = 0; // Facing customers forward
  scene.add(chefNPC);
  worldBlocks.push(chefNPC);
  solidObstacles.push(chefNPC);

  // Chef Hat Prop
  const hatGeo = new THREE.BoxGeometry(0.5, 0.4, 0.5);
  const hatMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const hat = new THREE.Mesh(hatGeo, hatMat);
  hat.position.set(0, 2.0, -7);
  scene.add(hat);

  // 2. Waiter NPC near the entrance (x: 5, z: 2)
  const waiterNPC = createNPCMesh("#1e293b"); // Black Tuxedo Vest
  waiterNPC.position.set(5, 0.0, 2);
  waiterNPC.rotation.y = -Math.PI / 3;
  scene.add(waiterNPC);
  worldBlocks.push(waiterNPC);
  solidObstacles.push(waiterNPC);
}

//===================
// Voxel World Generation Complete
function createTree(x, y, z) {
  const boxGeo = new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);

  // Trunk
  for (let i = 0; i < 3; i++) {
    const trunk = new THREE.Mesh(boxGeo, materials.wood);
    trunk.position.set(x, y + i, z);
    trunk.castShadow = true;
    scene.add(trunk);
    worldBlocks.push(trunk);
    solidObstacles.push(trunk);
  }

  // Leaves
  const leafTop = y + 3;
  for (let lx = -1; lx <= 1; lx++) {
    for (let lz = -1; lz <= 1; lz++) {
      for (let ly = 0; ly <= 2; ly++) {
        if (ly === 2 && Math.abs(lx) === 1 && Math.abs(lz) === 1) continue;
        const leaf = new THREE.Mesh(boxGeo, materials.leaves);
        leaf.position.set(x + lx, leafTop + ly, z + lz);
        leaf.castShadow = true;
        scene.add(leaf);
      }
    }
  }
}

function createFlower(x, y, z) {
  const mat =
    Math.random() > 0.5 ? materials.flowerPink : materials.flowerPurple;
  const flowerGeo = new THREE.BoxGeometry(0.3, 0.5, 0.3);
  const flower = new THREE.Mesh(flowerGeo, mat);
  flower.position.set(x, y + 0.25, z);
  scene.add(flower);
  worldBlocks.push(flower);
}

function createHeartMonument(x, y, z) {
  const heartPattern = [
    [0, 1, 1, 0, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 0, 0, 0],
  ];

  const boxGeo = new THREE.BoxGeometry(
    BLOCK_SIZE * 0.8,
    BLOCK_SIZE * 0.8,
    BLOCK_SIZE * 0.8,
  );
  for (let r = 0; r < heartPattern.length; r++) {
    for (let c = 0; c < heartPattern[r].length; c++) {
      if (heartPattern[r][c] === 1) {
        const block = new THREE.Mesh(boxGeo, materials.heartBlock);
        block.position.set(
          x + (c - 3) * 0.8,
          y + (heartPattern.length - r) * 0.8 + 2,
          z,
        );
        block.castShadow = true;
        scene.add(block);
      }
    }
  }

  // Glow light around heart
  const heartLight = new THREE.PointLight(0xf43f5e, 2, 12);
  heartLight.position.set(x, y + 4, z);
  scene.add(heartLight);
}

function createCampfire(x, y, z) {
  const logGeo = new THREE.BoxGeometry(0.8, 0.2, 0.2);
  const log1 = new THREE.Mesh(logGeo, materials.wood);
  log1.position.set(x, y + 0.1, z);
  log1.rotation.y = Math.PI / 4;
  const log2 = log1.clone();
  log2.rotation.y = -Math.PI / 4;
  scene.add(log1);
  scene.add(log2);

  // Fire light
  const fireLight = new THREE.PointLight(0xf97316, 2.5, 8);
  fireLight.position.set(x, y + 0.5, z);
  scene.add(fireLight);
}

function generateVoxelWorld() {
  const boxGeo = new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
  const halfSize = Math.floor(WORLD_SIZE / 2);

  // Instanced Mesh Setup for performance
  for (let x = -halfSize; x < halfSize; x++) {
    for (let z = -halfSize; z < halfSize; z++) {
      // Terrain Height function
      const distFromCenter = Math.sqrt(x * x + z * z);
      let yHeight = Math.floor(Math.sin(x * 0.2) * Math.cos(z * 0.2) * 1.5);

      if (distFromCenter > halfSize - 3) {
        yHeight += 2; // Outer boundaries
      }

      // Top Grass Block
      const grassMesh = new THREE.Mesh(boxGeo, materials.grass);
      grassMesh.position.set(x, yHeight, z);
      grassMesh.receiveShadow = true;
      grassMesh.castShadow = true;
      scene.add(grassMesh);
      worldBlocks.push(grassMesh);

      // Dirt underneath
      for (let dy = yHeight - 1; dy >= yHeight - 2; dy--) {
        const dirtMesh = new THREE.Mesh(boxGeo, materials.dirt);
        dirtMesh.position.set(x, dy, z);
        scene.add(dirtMesh);
        worldBlocks.push(dirtMesh);
      }

      // Place Trees & Flowers
      if (Math.abs(x) > 3 && Math.abs(z) > 3 && Math.random() < 0.04) {
        createTree(x, yHeight + 1, z);
      } else if (Math.random() < 0.08) {
        createFlower(x, yHeight + 1, z);
      }
    }
  }

  // Centerpiece: Glowing Romantic Heart Monument
  createHeartMonument(0, 1, -6);

  // Romantic Campfire
  createCampfire(0, 1, 0);

  // Spawn video orb
  createVideoOrb(0, 1, 6);
  //createVideoOrb(0, 1.5, -2);
}
