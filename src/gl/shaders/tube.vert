#include ./noise.glsl

uniform float uTime;
uniform vec2 uMouse;     // -1..1
uniform float uScroll;   // 0..1
uniform float uAmp;

varying vec3 vNormalW;
varying vec3 vViewDir;
varying float vFlow;     // 0..1 along the tube length (from UV)
varying float vNoise;

void main() {
  vec3 pos = position;

  // Flowing breathing displacement driven by simplex noise
  float n = snoise(pos * 0.35 + vec3(0.0, 0.0, uTime * 0.15));
  vNoise = n;
  pos += normal * n * uAmp;

  // Pointer parallax: gently push the field toward the cursor
  pos.x += uMouse.x * 0.6;
  pos.y += uMouse.y * 0.6;

  // Subtle scroll-driven drift
  pos.z += uScroll * 1.5;

  vFlow = uv.x;

  vec4 worldPos = modelMatrix * vec4(pos, 1.0);
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vViewDir = normalize(cameraPosition - worldPos.xyz);

  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
