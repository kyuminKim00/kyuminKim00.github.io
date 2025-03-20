import { Shader, readShaderFile } from '../../WebGLDist/WebGLSource/util/shader.js';
import { resizeAspectRatio, setupText } from '../../WebGLDist/WebGLSource/util/util.js';

const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let shader;   // shader program
let vao;      // vertex array object
let position = [0, 0]; // x, y 위치
const moveSpeed = 0.01;

// 키 상태 저장 객체
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false
};

async function initWebGL() {
    if (!gl) {
        console.error('WebGL 2를 지원하지 않는 브라우저입니다.');
        return false;
    }

    canvas.width = 600;
    canvas.height = 600;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    
    // 텍스트 메시지 설정
    setupText(canvas, "Use arrow keys to move the rectangle", 1);
    
    return true;
}

async function initShader() {
    try {
        // 셰이더 파일 읽기
        const vertexShaderSource = await readShaderFile('./shVert.glsl');
        const fragmentShaderSource = await readShaderFile('./shFrag.glsl');
        
        // Shader 클래스를 사용하여 셰이더 프로그램 생성
        shader = new Shader(gl, vertexShaderSource, fragmentShaderSource);
        shader.use();
        return true;
    } catch (error) {
        console.error('셰이더 초기화 실패:', error);
        return false;
    }
}

function setupKeyboardEvents() {
    window.addEventListener('keydown', (event) => {
        // 아래 if condition을 if (event.key in keys)로 간단히 할 수도 있음
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown' || 
            event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            keys[event.key] = true;
            //event.preventDefault();
        }
    });

    window.addEventListener('keyup', (event) => {
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown' || 
            event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            keys[event.key] = false;
        }
    });
}

function setupBuffers() {
    // 사각형 정점 데이터
    const vertices = [
        -0.1, -0.1,
         0.1, -0.1,
         0.1,  0.1,
        -0.1,  0.1
    ];
    
    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    
    // 정점 버퍼 생성
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    shader.setAttribPointer('aPosition', 2, gl.FLOAT, false, 0, 0);
    
    // 색상 데이터
    const colors = [
        1.0, 0.0, 0.0,
        1.0, 0.0, 0.0,
        1.0, 0.0, 0.0,
        1.0, 0.0, 0.0
    ];
    
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    shader.setAttribPointer('aColor', 3, gl.FLOAT, false, 0, 0);
}

function handleKeyInput() {
    const rect = { width: 0.2, height: 0.2 }; // 사각형의 크기
    
    let nextX = position[0];
    let nextY = position[1];
    
    if (keys.ArrowUp) nextY += moveSpeed;
    if (keys.ArrowDown) nextY -= moveSpeed;
    if (keys.ArrowLeft) nextX -= moveSpeed;
    if (keys.ArrowRight) nextX += moveSpeed;
    
    const maxX = 1 - rect.width/2;
    const minX = -1 + rect.width/2;
    const maxY = 1 - rect.height/2;
    const minY = -1 + rect.height/2;
    
    if (nextX >= minX && nextX <= maxX) position[0] = nextX;
    if (nextY >= minY && nextY <= maxY) position[1] = nextY;
}

function render() {
    handleKeyInput();
    
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    shader.setVec2('uTranslation', position);
    
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    
    requestAnimationFrame(render);
}

async function main() {
    try {
        // WebGL 초기화
        if (!initWebGL()) {
            throw new Error('WebGL 초기화 실패');
        }

        // 셰이더 초기화
        if (!await initShader()) {
            throw new Error('셰이더 초기화 실패');
        }

        // 키보드 이벤트 설정
        setupKeyboardEvents();
        
        // 버퍼 설정
        setupBuffers();
        
        // 화면 크기 조정 이벤트 리스너 추가
        window.addEventListener('resize', () => {
            resizeAspectRatio(canvas);
            gl.viewport(0, 0, canvas.width, canvas.height);
        });
        
        // 초기 화면 크기 설정
        resizeAspectRatio(canvas);

        // 렌더링 시작
        render();

        return true;

    } catch (error) {
        console.error('프로그램 초기화 실패:', error);
        alert('프로그램 초기화에 실패했습니다.');
        return false;
    }
}

// 프로그램 시작
main().then(success => {
    if (!success) {
        console.log('프로그램을 종료합니다.');
        return;
    }
}).catch(error => {
    console.error('프로그램 실행 중 오류 발생:', error);
});