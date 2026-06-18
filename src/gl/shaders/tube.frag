precision highp float;

uniform float uTime;
uniform vec3 uAccent;
uniform vec3 uGlow;
uniform float uScroll;

varying vec3 vNormalW;
varying vec3 vViewDir;
varying float vFlow;
varying float vNoise;

void main() {
  // Fresnel rim — bright edges, the core of the "light scattering" look
  float fres = pow(1.0 - clamp(dot(normalize(vNormalW), normalize(vViewDir)), 0.0, 1.0), 2.5);

  // Animated gradient along the tube, shifting with time + flow
  float t = fract(vFlow * 2.0 + uTime * 0.05 + vNoise * 0.2);
  vec3 base = mix(uAccent, uGlow, smoothstep(0.0, 1.0, t));

  // Emissive core + fresnel halo (kept restrained so additive overlaps
  // glow rather than blowing out to white)
  vec3 color = base * (0.18 + 0.45 * fres);
  color += uGlow * pow(fres, 1.6) * 0.5;

  // Low per-fragment alpha so many overlapping tubes accumulate gently
  float alpha = 0.16 + 0.4 * fres;

  gl_FragColor = vec4(color, alpha);
}
