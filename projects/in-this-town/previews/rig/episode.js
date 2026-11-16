// Look test: the classic avatars at real-world size in Pigeon Creek (grown-ups ~1.75 m, kids ~1.35 m)
import { createCore } from '../../kit/core.js';
import { buildFarm, SWY } from '../../kit/farm.js';
import { avatar } from '../../kit/rig.js';
import { prop } from '../../kit/assets.js';
await document.fonts.load('800 40px Poppins');
const C = createCore(document.getElementById('c'), { look: 'blender' });
const { THREE, scene, camera, composer, setLight } = C;
camera.near = 0.1; camera.far = 900;
buildFarm(scene);
const pickup = await prop(scene, 'truck', 5.4); pickup.position.set(-3.7, 0, -9);
const CAST = [
  ['mayor', { skin: 0x8a5a3a, shirt: 0x24242e, pants: 0x1b1b24, hair: 0x111111, hairStyle: 'short', hat: 'tophat' }, 1.82, 'smug'],
  ['mom', { skin: 0xf0c090, shirt: 0xe8607a, pants: 0x3a4a7a, hair: 0x7a4a2a, hairStyle: 'ponytail' }, 1.7, 'smile'],
  ['theo', { skin: 0xf6c89a, shirt: 0x3fa05a, pants: 0x2c3e74, hair: 0xd8743a, hairStyle: 'messy' }, 1.4, 'happy'],
  ['maya', { skin: 0xc98d62, shirt: 0x8b5cf6, pants: 0x2c3e74, hair: 0x2a1a12, hairStyle: 'ponytail' }, 1.32, 'determined'],
  ['leo', { skin: 0x8a5a3a, shirt: 0x2a9d8f, pants: 0x3a3a46, hair: 0x111111, hairStyle: 'short', backpack: 0xe8434f }, 1.36, 'cool'],
  ['grandpa', { skin: 0xf6c89a, shirt: 0x9ad0f0, pants: 0x6a6a76, hair: 0xe8e8e8, hairStyle: 'short', glasses: true }, 1.72, 'proud'],
  ['sheriff', { skin: 0xd8a070, shirt: 0x1f2b55, pants: 0x1f2b55, hat: 'police', hairStyle: 'short' }, 1.8, 'deadpan'],
];
const cast = CAST.map(([n, o, h, f]) => avatar(scene, o, h, { face: f }));
window.SHOT_TIMES = [0, 1, 2]; window.END = 3;
window.renderAt = (t) => {
  setLight('morning', [-6, 0, 2]);
  if (t < 1) { // lineup on the sidewalk in front of the diner door (2.35 m) and a pickup
    const spots = { mayor: [-7.5, 5.4], mom: [-7.5, 3.9], sheriff: [-7.5, 2.4], grandpa: [-7.5, 0.9], theo: [-6.2, 4.7], maya: [-6.2, 3.2], leo: [-6.2, 1.7] };
    CAST.forEach(([n], i) => { const c = cast[i], [x, z] = spots[n]; c.root.position.set(x, SWY, z); c.root.rotation.y = Math.PI / 2; c.pose('idle', 0.3 + i * 0.4); });
    camera.position.set(-0.4, 1.35, 3.15); camera.lookAt(-7.0, 1.15, 3.15); camera.fov = 52;
  } else if (t < 2) { // animation strip: walk, sprint, cheer, refuse, carry, sit, wave
    const clips = ['walk', 'sprint', 'cheer', 'emote-no', 'holding-both', 'pick-up', 'wave'];
    cast.forEach((c, i) => { c.root.position.set(-2.8 + i * 0.95, 0, -6 - (i % 2) * 1.2); c.root.rotation.y = 0.2; c.pose(clips[i], 0.21 + i * 0.07, null, 0, 0, { once: clips[i] === 'pick-up' }); });
    camera.position.set(0.2, 1.7, 3.2); camera.lookAt(0.0, 0.9, -6.5); camera.fov = 55;
  } else { // street view: how big people are next to the shops
    cast.forEach((c, i) => { c.root.position.set(i % 2 ? 6.4 : -6.4, SWY, -6 - i * 4.5); c.root.rotation.y = i % 2 ? Math.PI : 0; c.pose('walk', t * 0.9 + i * 0.3); });
    camera.position.set(0.3, 2.2, 6); camera.lookAt(0, 1.4, -24); camera.fov = 55;
  }
  camera.updateProjectionMatrix(); composer.render();
};
window.READY = true;
