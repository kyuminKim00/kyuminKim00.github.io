#version 300 es
in vec2 aPosition;
in vec3 aColor;
uniform vec2 uTranslation;
out vec3 vColor;

void main() {
    vec2 position = aPosition + uTranslation;
    gl_Position = vec4(position, 0.0, 1.0);
    vColor = aColor;
} 