LINE_WIDTH = 5;
COMPLEXITY = 3;
STEP = 0.003;

wave1 = null;
wave2 = null;
wave3 = null;

osc1 = null;
osc2 = null;
osc3 = null;

mod1 = null;
mod2 = null;
mod3 = null;

gfx = null;
fx = null;

class Sine {
    constructor(fr, amp) {
        colorMode(HSB);
        this.fr = Math.round(fr);
        this.a = amp;
        this.col = color(random(255), 200, 255);
    }

    f(x) {
        return this.a * Math.sin(this.fr * PI * x / width);
    }

    c(x) {
        return this.col;
    }

    render() {
        for (let x = 0; x <= width; x++) {
            noStroke();
            fill(this.col);
            circle(x, this.f(x), LINE_WIDTH);
        }
    }
}

class Wave {
    constructor(sines) {
        this.sines = sines;
    }

    f(x) {
        let out = 0;
        for (let s of this.sines) {
            out += s.f(x);
        }
        return out;
    }

    c(x) {
        let out = this.sines[0].c(x);
        for (let s of this.sines) {
            let v = s.f(x);
            let r = abs(v) / s.a;
            out = lerpColor(out, s.c(x), r);
        }
        return out;
    }

    freqs() {
        return this.sines.map(s => s.fr);
    }

    amps() {
        return this.sines.map(s => s.a);
    }

    render() {
        for (let x = -5; x <= width + 5; x++) {
            noStroke();
            fill(this.c(x));
            circle(x, this.f(x), LINE_WIDTH);
        }
    }
}

class FluidWave {
    constructor(wid) {
        this.w1 = make_wave();
        this.w2 = make_wave();
        this.wid = wid
        this.r = random(0, 1.0);

        this.osc = null;
        this.mod = null;
    }

    f(x) {
        return lerp(this.w1.f(x), this.w2.f(x), smoothstep(this.r));
    }

    c(x) {
        return lerpColor(this.w1.c(x), this.w2.c(x), smoothstep(this.r));
    }

    updateOcs() {
        let freqs = this.w2.freqs();
        let amps = this.w2.amps();

        let modDepth = amps.reduce((v,acc) => v + acc) * 5;
        let carrFreq = map(min(freqs), 1, 15, 110, 440);
        let modFreq = freqs.reduce((v,acc) => v + acc) / freqs.length * 0.2 * carrFreq;

        this.mod.amp(modDepth, 20);
        this.mod.freq(modFreq, 20);
        this.osc.freq(carrFreq, 20);
    }

    render() {
        for (let x = -5; x <= width + 5; x++) {
            gfx.noStroke();
            gfx.fill(this.c(x));
            gfx.circle(x, this.f(x), LINE_WIDTH * this.wid);
        }
        this.r += STEP;
        if (this.r > 1) {
            this.r = 0;
            this.w1 = this.w2;
            this.w2 = make_wave();

            this.updateOcs();
        }
    }
}

function smoothstep(x) {
    if (x <= 0) {
        return 0;
    }
    else if (x >= 1) {
        return 1;
    }
    return 3 * (x**2) - 2 * (x**3);
}

function make_sine() {
    return new Sine(random(1, 15), random(0.1, 0.1 * height));
}

function make_wave() {
    let sines = [];
    for (let i = 0; i < COMPLEXITY; i++) {
        sines.push(make_sine());
    }
    return new Wave(sines);
}

function preload() {
    fx = loadShader("pass.vert", "fx.frag");
}

function setup() {
    let cnv = createCanvas(400, 400, WEBGL);
    wave1 = new FluidWave(1.2);
    wave2 = new FluidWave(0.8);
    wave3 = new FluidWave(1.0);
    gfx = createGraphics(width, height);
    gfx.translate(0, height / 2);

    setupSound();
    toggleSound(cnv);
}

function draw() {
    translate(-width / 2, 0);
    gfx.colorMode(RGB);
    gfx.background(5,5,20);
    wave1.render();
    wave2.render();
    wave3.render();

    fx.setUniform("screen", gfx);
    fx.setUniform("texSize", [width, height]);
    fx.setUniform("time", 0);
    shader(fx);
    rect(0,0,width,height);
    resetShader();
}

function setupSound() {
    osc1 = new p5.Oscillator('sine');
    osc2 = new p5.Oscillator('sine');
    osc3 = new p5.Oscillator('sine');
    
    osc1.start();
    osc2.start();
    osc3.start();

    osc1.amp(0);
    osc2.amp(0);
    osc3.amp(0);

    mod1 = new p5.Oscillator('sine');
    mod2 = new p5.Oscillator('sine');
    mod3 = new p5.Oscillator('sine');

    mod1.start();
    mod2.start();
    mod3.start();

    mod1.disconnect();
    mod2.disconnect();
    mod3.disconnect();

    osc1.freq(mod1);
    osc2.freq(mod2);
    osc3.freq(mod3);

    mod1.freq(220);
    mod2.freq(220);
    mod3.freq(220);

    osc1.freq(220);
    osc2.freq(220);
    osc3.freq(220);

    mod1.amp(0);
    mod2.amp(0);
    mod3.amp(0);

    wave1.osc = osc1;
    wave2.osc = osc2;
    wave3.osc = osc3;

    wave1.mod = mod1;
    wave2.mod = mod2;
    wave3.mod = mod3;

    wave1.updateOcs();
    wave2.updateOcs();
    wave3.updateOcs();

    osc1.disconnect();
    osc2.disconnect();
    osc3.disconnect();

    let echo = new p5.Delay();
    echo.process(osc1);
    echo.process(osc2);
    echo.process(osc3);
    echo.delayTime(1.0);
    echo.feedback(0.7);
    echo.filter(220);
    echo.setType('pingPong');

    let verb = new p5.Reverb();
    verb.process(osc1);
    verb.process(osc2);
    verb.process(osc3);
    verb.process(echo);
    verb.set(7, 2, true);
    verb.drywet(0.9);
}

function toggleSound(cnv) {
    cnv.mouseOver(() => {
        osc1.amp(0.1, 1.0);
        osc2.amp(0.1, 1.0);
        osc3.amp(0.1, 1.0);
    });
    cnv.touchStarted(() => {
        osc1.amp(0.1, 1.0);
        osc2.amp(0.1, 1.0);
        osc3.amp(0.1, 1.0);
    });

    cnv.mouseOut(() => {
        osc1.amp(0.0, 0.5);
        osc2.amp(0.0, 0.5);
        osc3.amp(0.0, 0.5);
    });
    cnv.touchEnded(() => {
        osc1.amp(0.0, 0.5);
        osc2.amp(0.0, 0.5);
        osc3.amp(0.0, 0.5);
    });
}