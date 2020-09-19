precision mediump float;

uniform sampler2D screen;
uniform float time;
uniform vec2 texSize;

varying vec4 vertTexCoord;

vec2 bulge(vec2 pos) {
    const vec2 c = vec2(0.5, 0.5);
    vec2 d = vertTexCoord.xy - c;
    float dist = length(d);
    float r = dist / 0.5;
    float a = atan(d.y, d.x);
    float rn = pow(r, 0.3) * dist;
    return vec2(rn * cos(a) + c.x, rn * sin(a) + c.y);
}

vec2 sphere(vec2 pos) {
    const vec2 c = vec2(0.5, 0.5);
    const float k = -3.0;
    vec2 d = c - pos;
    float rd = length(d);
    float ru = rd * (1.0 + k * rd * rd);
    vec2 nuD = normalize(d) * ru;

    return pos + nuD;
}

void main() {
    const int size = 5;
    vec3 color = vec3(0);
    float t = 0.0;

    vec2 pos = vertTexCoord.xy;

    for (int i = -size; i <= size; i++) {
        for (int j = -size; j <= size; j++) {
            vec2 c = pos + vec2(i, j) / texSize;
            vec3 col = texture2D(screen, c).rgb;
            float d = sqrt(float(j*j + i*i));
            float w = 1.0 / (d + 1.0);
            if (d < float(size))  {
                color += col * w * 4.0 * (0.5 + sin(time) * 0.5);
                t += w;
            }
        }
    }

    color /= t;
    vec3 oc = texture2D(screen, pos).rgb;
    color += oc;
    color = vec3(
        clamp(color.r, oc.r, 1.0),
        clamp(color.g, oc.g, 1.0),
        clamp(color.b, oc.b, 1.0)
    );
    gl_FragColor = vec4(color, 1.0);
}