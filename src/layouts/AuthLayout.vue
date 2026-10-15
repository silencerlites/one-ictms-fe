<template>
  <q-layout view="hHh lpR fFf">
    <q-page-container>
      <q-page class="ictms-entry">
        <div class="ictms-entry__frame">
          <aside class="ictms-brand" :style="motion" @pointermove="onPointerMove" @pointerleave="resetMotion">
            <header class="ictms-brand__header">
              <div class="ictms-brand__mark"><q-icon name="widgets" size="25px" /></div>
              <div>
                <div class="ictms-brand__name">ONE ICTMS</div>
                <div class="ictms-brand__sub">Department of Social Welfare and Development</div>
              </div>
            </header>

            <div class="ictms-brand__spiral" aria-hidden="true">
              <span class="ictms-brand__spiral-ring ictms-brand__spiral-ring--one"></span>
              <span class="ictms-brand__spiral-ring ictms-brand__spiral-ring--two"></span>
              <span class="ictms-brand__spiral-ring ictms-brand__spiral-ring--three"></span>
              <span class="ictms-brand__spiral-orbit"></span>
            </div>
            <div class="ictms-brand__center">
              <div class="future-scene">
                <div class="future-scene__halo"></div>
                <div class="future-scene__orbit future-scene__orbit--one"></div>
                <div class="future-scene__orbit future-scene__orbit--two"></div>
                <div class="future-scene__device">
                  <div class="future-scene__screen">
                    <div class="future-scene__screen-head"><span></span><span></span><span></span></div>
                    <div class="future-scene__screen-body">
                      <div class="future-scene__nav"><i></i><i></i><i></i><i></i></div>
                      <div class="future-scene__content">
                        <div class="future-scene__skeleton"><b></b><b></b><b></b></div>
                        <div class="future-scene__chart"><i></i><i></i><i></i><i></i></div>
                      </div>
                    </div>
                  </div>
                  <div class="future-scene__keyboard"></div>
                </div>
                <!-- Interactive floating icons: hover, focus or tap to reveal a typing label. -->
                <button
                  v-for="feature in floatingFeatures"
                  :key="feature.id"
                  type="button"
                  class="future-scene__tile"
                  :class="[`future-scene__tile--${feature.id}`, { 'future-scene__tile--revealed': activeFeature === feature.id }]"
                  :aria-label="feature.label"
                  :aria-expanded="activeFeature === feature.id"
                  @mouseenter="activeFeature = feature.id"
                  @mouseleave="activeFeature = null"
                  @focus="activeFeature = feature.id"
                  @blur="activeFeature = null"
                  @click="activeFeature = activeFeature === feature.id ? null : feature.id"
                >
                  <q-icon :name="feature.icon" size="27px" aria-hidden="true" />
                  <span class="future-scene__tooltip" aria-hidden="true">
                    <span
                      :key="`${feature.id}-${activeFeature === feature.id}`"
                      class="future-scene__typing"
                      :style="{ '--typing-steps': String(feature.label.length), '--label-width': `${feature.label.length + 1}ch` }"
                    >{{ feature.label }}</span>
                  </span>
                </button>
                <i class="future-scene__star future-scene__star--a"></i>
                <i class="future-scene__star future-scene__star--b"></i>
                <i class="future-scene__star future-scene__star--c"></i>
              </div>

              <div class="ictms-brand__message">
                <h1 class="future-title"><span>Unified Systems.</span><span>Smarter Services.</span></h1>
                <p class="future-subtitle">A seamless digital workspace for DSWD.</p>
                <div class="ictms-brand__accent" aria-hidden="true"><i></i><i></i><i></i></div>
              </div>
              <div class="ictms-brand__benefits" aria-label="Workspace benefits">
                <div class="ictms-benefit ictms-benefit--people"><q-icon name="groups" size="24px" /><span>People<br>centered</span></div>
                <div class="ictms-benefit ictms-benefit--process"><q-icon name="settings_suggest" size="24px" /><span>Efficient<br>processes</span></div>
                <div class="ictms-benefit ictms-benefit--impact"><q-icon name="bar_chart" size="24px" /><span>Greater<br>impact</span></div>
              </div>
            </div>

            <footer class="ictms-brand__footer">
              <span>Department of Social Welfare and Development</span>
            </footer>
          </aside>

          <main class="ictms-entry__main">
            <div class="ictms-entry__content" :class="{ 'ictms-entry__content--login': route.path === '/login', 'ictms-entry__content--register': route.path === '/register' }">
              <!-- Keep the card mounted while switching routes to avoid width collapse and blank frames. -->
              <q-card flat class="auth-card">
                <router-view />
              </q-card>
            </div>
            <!-- Decorative DSWD footer: only on the login screen. -->
            <div v-if="route.path === '/login'" class="login-bottom-art" aria-hidden="true">
              <div class="login-bottom-art__message">
                <span>FOR A STRONGER,</span>
                <span>MORE INCLUSIVE PHILIPPINES.</span>
                <div class="login-bottom-art__marks"><i></i><i></i><i></i></div>
              </div>
            </div>
          </main>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const activeFeature = ref<string | null>(null)
const floatingFeatures = [
  { id: 'people', label: 'People Centered', icon: 'groups' },
  { id: 'process', label: 'Efficient Processes', icon: 'settings' },
  { id: 'impact', label: 'Greater Impact', icon: 'bar_chart' },
] as const

const motion = ref<Record<string, string>>({ '--move-x': '0px', '--move-y': '0px' })

function onPointerMove(event: PointerEvent): void {
  if (event.pointerType === 'touch' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const el = event.currentTarget as HTMLElement
  const rect = el.getBoundingClientRect()
  motion.value = {
    '--move-x': `${((event.clientX - rect.left) / rect.width - 0.5) * 12}px`,
    '--move-y': `${((event.clientY - rect.top) / rect.height - 0.5) * 12}px`,
  }
}

function resetMotion(): void {
  motion.value = { '--move-x': '0px', '--move-y': '0px' }
}
</script>

<style scoped lang="scss">
.ictms-entry {
  min-height: 100vh;
  padding: clamp(12px, 2.4vw, 30px);
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f3fa;
}

.ictms-entry__frame {
  width: min(100%, 1600px);
  min-height: min(890px, calc(100vh - 36px));
  display: grid;
  grid-template-columns: minmax(0, 48%) minmax(0, 52%);
  border-radius: 28px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 32px 80px rgba(29, 33, 99, .09);
}

.ictms-brand {
  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  padding: clamp(26px, 3.6vw, 58px);
  color: #fff;
  background: radial-gradient(ellipse at 94% 67%, rgba(81, 89, 215, .45), transparent 55%),
    linear-gradient(145deg, #171d60 0%, #252a84 56%, #3439a7 100%);
}

.ictms-brand::before {
  content: '';
  position: absolute;
  width: 650px;
  height: 650px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,.08);
  right: -380px;
  top: -420px;
  box-shadow: 0 0 0 70px rgba(255,255,255,.025), 0 0 0 135px rgba(255,255,255,.015);
  z-index: -1;
}

.ictms-brand__header { display:flex; align-items:center; gap:16px; position:relative; z-index:1; }
.ictms-brand__mark { display:grid; place-items:center; width:54px; height:54px; border-radius:16px; border:1px solid rgba(255,255,255,.22); background:rgba(255,255,255,.13); }
.ictms-brand__name { font-size:40px; letter-spacing:-.04em; font-weight:800; }
.ictms-brand__sub { font-size:12px; color:#c5c9f4; margin-top:3px; }
.ictms-brand__tricolor { display:flex; gap:4px; margin-top:9px; }
.ictms-brand__tricolor i { display:block; width:30px; height:3px; border-radius:3px; background:#ed253b; }
.ictms-brand__tricolor i:nth-child(2) { width:22px; background:#fcd116; }
.ictms-brand__tricolor i:nth-child(3) { width:35px; background:#aeb7f5; }

.ictms-brand__center { position:relative; z-index:1; margin:auto 0; padding:40px 0 34px; }
.ictms-network { position:relative; width:min(100%, 540px); height:280px; margin-bottom:24px; transform:translate3d(calc(var(--move-x) * .65), calc(var(--move-y) * .65),0); transition:transform .55s cubic-bezier(.2,.8,.2,1); }
.ictms-network__dots { position:absolute; width:160px; height:170px; right:0; top:0; opacity:.28; background-image:radial-gradient(#7d93f9 1.5px, transparent 1.5px); background-size:14px 14px; }
.ictms-network__wires { position:absolute; inset:0; width:100%; height:100%; overflow:visible; }
.ictms-network__wires path { stroke:#c7cffd; stroke-width:1.8; opacity:.66; stroke-linecap:round; }
.ictms-network__junction { stroke:#e8ecff; stroke-width:3; }
.ictms-network__junction--red { fill:#ee1a24; }
.ictms-network__junction--gold { fill:#fcd116; }
.ictms-network__card { position:absolute; display:flex; border-radius:23px; box-shadow:0 22px 38px rgba(4,10,61,.24); transition:transform .25s ease, box-shadow .25s ease; animation:cardArrive .75s ease both; }
.ictms-network__card:hover { transform:translateY(-7px) rotate(0deg); box-shadow:0 30px 48px rgba(4,10,61,.32); }
.ictms-network__card--connected { width:44%; height:222px; top:30px; left:6%; flex-direction:column; justify-content:space-between; padding:24px; background:linear-gradient(140deg,rgba(134,139,250,.65),rgba(74,80,184,.58)); border:1px solid rgba(255,255,255,.32); backdrop-filter:blur(14px); transform:rotate(-2deg); }
.ictms-network__icon { width:65px; height:65px; display:grid; place-items:center; border-radius:18px; color:#fff; background:rgba(255,255,255,.15); }
.ictms-network__card--connected span { font-size:17px; text-transform:uppercase; font-weight:800; line-height:1.2; letter-spacing:.03em; }
.ictms-network__meter { width:100%; height:7px; background:rgba(255,255,255,.2); border-radius:10px; }
.ictms-network__meter i { display:block; width:62%; height:100%; border-radius:10px; background:#fcd116; animation:meterGrow 2.5s ease-in-out infinite alternate; }
.ictms-network__card--process, .ictms-network__card--impact { height:100px; width:46%; right:2%; align-items:center; padding:14px; gap:12px; }
.ictms-network__card--process { top:16px; background:linear-gradient(135deg,#ed263c,#bc1641); animation-delay:.1s; }
.ictms-network__card--impact { top:136px; background:linear-gradient(135deg,#ffdb59,#f9c924); color:#272b7b; animation-delay:.2s; }
.ictms-network__card--process > .q-icon, .ictms-network__card--impact > .q-icon { flex:none; background:rgba(255,255,255,.13); border-radius:13px; padding:8px; box-sizing:content-box; }
.ictms-network__card--impact > .q-icon { background:rgba(30,36,115,.1); }
.ictms-network__card--process div:not(.ictms-network__mini-line), .ictms-network__card--impact div:not(.ictms-network__mini-line) { display:grid; gap:2px; font-size:13px; text-transform:uppercase; font-weight:800; line-height:1.12; }
.ictms-network__mini-line { position:absolute; left:74px; bottom:17px; width:56px; height:4px; border-radius:5px; background:rgba(255,255,255,.52); }
.ictms-network__card--impact .ictms-network__mini-line { background:rgba(39,43,123,.32); }
.ictms-network__spark { position:absolute; width:12px; height:12px; border-radius:50%; background:#fcd116; box-shadow:0 0 0 5px rgba(252,209,22,.12); }
.ictms-network__spark--a { top:7px; left:30%; }
.ictms-network__spark--b { bottom:6px; left:37%; background:#5782ff; }
.ictms-network__spark--c { top:115px; right:0; background:#ed253b; }

.ictms-brand__message { position:relative; }
.ictms-brand__message h1 { margin:0; font-size:clamp(2.15rem,3.1vw,4rem); line-height:1.12; font-weight:750; letter-spacing:-.052em; }
.ictms-brand__message h1 span { display:block; white-space:nowrap; }
.ictms-brand__message h1 span:first-child { font-weight:400; }
.ictms-brand__message h1 strong { font-weight:850; }
.ictms-brand__message h1 span:nth-child(2) { color:#fcd116; font-weight:820; }
.ictms-brand__accent { display:flex; gap:5px; margin:23px 0 18px; }
.ictms-brand__accent i { display:block; height:4px; width:52px; background:#ee1a24; border-radius:6px; }
.ictms-brand__accent i:nth-child(2) { width:23px; background:#fcd116; }
.ictms-brand__accent i:nth-child(3) { width:34px; background:#c9cdfa; }
.ictms-brand__message p { margin:0; color:#e3e6fd; font-size:clamp(.9rem,1.1vw,1.05rem); line-height:1.7; max-width:440px; }
.ictms-brand__footer { position:relative; z-index:1; color:#cbd0ee; font-size:11px; }
.ictms-entry__main { display:flex; background:#fff; min-width:0; }
.ictms-entry__content { width:100%; display:flex; align-items:center; justify-content:center; padding:46px clamp(25px,5vw,90px); }
.ictms-entry__content .auth-card { width:min(100%,560px); max-width:560px; border:0; background:transparent; box-shadow:none; }
@keyframes cardArrive { from { opacity:0; translate:0 14px; } to { opacity:1; translate:0 0; } }
@keyframes meterGrow { from { width:48%; } to { width:79%; } }
@media(max-width:1200px) { .ictms-brand { padding:32px; } .ictms-network { height:235px; } .ictms-network__card--connected {height:192px;} .ictms-network__card--process,.ictms-network__card--impact {height:88px;} .ictms-network__card--impact { top:122px; } .ictms-brand__message h1 { font-size:clamp(2rem,3vw,3.1rem); } }
@media(max-width:900px) { .ictms-entry__frame { grid-template-columns:1fr; } .ictms-brand {padding:28px 35px;} .ictms-brand__center {padding:25px 0;} .ictms-network { display:none; } .ictms-brand__footer {display:none;} .ictms-entry__content {padding:42px 24px;} .ictms-brand__message h1 {font-size:clamp(2rem,6vw,3.4rem);} }
@media(max-width:500px) { .ictms-entry {padding:8px;} .ictms-entry__frame {border-radius:20px;} .ictms-brand {padding:22px;} .ictms-brand__message h1 {font-size:clamp(1.6rem,6.8vw,2.4rem);} .ictms-brand__message p {font-size:13px;} .ictms-entry__content {padding:24px 15px;} }
@media(prefers-reduced-motion:reduce) { .ictms-network, .ictms-network * {animation:none!important;transition:none!important;} }

/* V19: reference-matched compact network graphic and editorial branding */
.ictms-entry__frame { grid-template-columns: minmax(0, 48%) minmax(0, 52%); }
.ictms-brand {
  background:
    radial-gradient(ellipse at 92% 62%, rgba(72,87,219,.45),transparent 58%),
    linear-gradient(155deg,#12194e 0%,#1c287b 52%,#2b37a9 100%);
}
.ictms-brand::after {
  content: ''; position: absolute; z-index: -1; pointer-events: none;
  inset: auto -10% -2% -14%; height: 37%;
  background: linear-gradient(22deg,rgba(17,26,94,.62),rgba(95,112,213,.10) 60%,transparent 61%);
  clip-path: polygon(0 72%,15% 77%,25% 70%,45% 82%,65% 55%,83% 50%,100% 20%,100% 100%,0 100%);
}
.ictms-brand__skyline {
  position:absolute;pointer-events:none;bottom:-17px;right:-5%;z-index:0;
  height:25%;width:72%; transform:skewY(-20deg) rotate(-3deg);transform-origin:bottom right;
  opacity:.16;display:flex;align-items:flex-end;gap:6px;
}
.ictms-brand__skyline i {display:block; flex:1; height:85%; border:1px solid #c1cbff;
  background:repeating-linear-gradient(0deg,transparent 0 18px,rgba(209,219,255,.65) 18px 20px),
  repeating-linear-gradient(90deg,transparent 0 26px,rgba(209,219,255,.7) 26px 28px);}
.ictms-brand__skyline i:nth-child(2n){height:68%}
.ictms-brand__skyline i:nth-child(3n){height:100%}
.ictms-brand__center { width:100%; padding:18px 0 36px; }
.ictms-network {width:min(100%,500px);height:286px;margin-bottom:20px;}
.ictms-network__card--connected {
  width:41%;height:210px;left:5%;top:32px;padding:24px;
  transform:rotate(-1.4deg);border-radius:25px;
  background:linear-gradient(135deg,rgba(132,143,249,.72),rgba(70,79,190,.62));
  box-shadow:inset 1px 1px 0 rgba(255,255,255,.4),0 22px 38px rgba(7,13,65,.22);
}
.ictms-network__card--connected span {font-size:14px;line-height:1.3}
.ictms-network__icon {width:72px;height:72px;background:rgba(255,255,255,.17)}
.ictms-network__card--process, .ictms-network__card--impact {width:43%;height:94px;right:3%;padding:13px 16px;}
.ictms-network__card--process {top:35px;background:linear-gradient(115deg,#f12b48,#c61e4b);}
.ictms-network__card--impact {top:152px;background:linear-gradient(120deg,#ffe364,#f9cd32);}
.ictms-network__card--process div:not(.ictms-network__mini-line),
.ictms-network__card--impact div:not(.ictms-network__mini-line) {font-size:13px;}
.ictms-network__wires {opacity:.9}
.ictms-network__dots {right:0;top:4px;width:140px;height:245px;}
.ictms-brand__message h1 {font-size:clamp(2.3rem,3.5vw,4.3rem);line-height:1.1;letter-spacing:-.05em;}
.ictms-brand__message h1 span:first-child {font-weight:400}
.ictms-brand__message h1 span:nth-child(2) {font-weight:850;color:#ffda40}
.ictms-brand__accent {margin:21px 0 20px}
.ictms-brand__message p {font-size:clamp(.82rem,.95vw,1rem);letter-spacing:.15em;text-transform:uppercase;line-height:1.8;max-width:440px}
.ictms-brand__footer {line-height:1.5}
.ictms-entry__content {padding:45px clamp(28px,5.6vw,92px)}
@media(max-width:1200px){
  .ictms-network {height:240px;width:min(100%,450px)}
  .ictms-network__card--connected {height:175px;top:31px;padding:17px}
  .ictms-network__card--process,.ictms-network__card--impact {height:78px}
  .ictms-network__card--impact {top:128px}
  .ictms-brand__message h1 {font-size:clamp(1.9rem,3.2vw,3.3rem)}
}
@media(max-width:900px){.ictms-brand__center {padding:20px 0}.ictms-brand__skyline{display:none}.ictms-brand__message p {letter-spacing:.04em}}
@media(max-width:500px){.ictms-brand__message h1 {font-size:clamp(1.65rem,6.4vw,2.4rem)} }


/* V20: reference proportions and a compact, optically centered login form */
.ictms-entry__frame {
  grid-template-columns: minmax(0, 48%) minmax(0, 52%);
}
.ictms-entry__content--login {
  padding-inline: clamp(28px, 5vw, 78px);
}
.ictms-entry__content--login .auth-card {
  width: min(100%, 470px);
  max-width: 470px;
}
.ictms-brand__center {
  padding-top: 22px;
  padding-bottom: 25px;
}
.ictms-brand__message h1 {
  font-size: clamp(2.2rem, 3.3vw, 4rem);
  line-height: 1.09;
}
@media (max-width: 1200px) {
  .ictms-entry__content--login .auth-card { max-width: 440px; }
}
@media (max-width: 900px) {
  .ictms-entry__frame { grid-template-columns: 1fr; }
  .ictms-entry__content--login { padding: 36px 24px 46px; }
  .ictms-entry__content--login .auth-card { max-width: 470px; }
}
@media (max-width: 500px) {
  .ictms-entry__content--login { padding: 24px 16px 30px; }
}


/* Futuristic workspace illustration — CSS rendered, no image dependency */
.future-scene { position: relative; width:min(100%,540px); aspect-ratio: 1.62; margin:0 0 18px; isolation:isolate; transform:translate3d(calc(var(--move-x) * .6),calc(var(--move-y) * .6),0); transition:transform .4s ease; }
.future-scene__halo { position:absolute; inset:12% 6%; border-radius:50%; background:radial-gradient(ellipse,rgba(63,128,255,.28),transparent 69%); filter:blur(9px); animation:futureBreath 5s ease-in-out infinite; }
.future-scene__orbit { position:absolute; inset:12% 9%; border:1px solid rgba(128,182,255,.32); border-radius:50%; transform:rotate(-14deg); }
.future-scene__orbit--two { inset:24% 4%; transform:rotate(24deg); border-color:rgba(247,207,40,.18); }
.future-scene__device { position:absolute; top:23%; left:22%; width:62%; height:62%; transform:rotate(-4deg) skewY(2deg); animation:deviceFloat 7s ease-in-out infinite; filter:drop-shadow(0 16px 17px rgba(3,10,59,.52)); }
.future-scene__screen { width:100%; height:89%; padding:7px; border-radius:13px; border:2px solid #6f9fff; background:#d5e7ff; box-shadow:0 0 20px rgba(73,146,255,.6),inset 0 0 11px rgba(104,180,255,.65); }
.future-scene__screen-head { height:16%; background:#1937a0; border-radius:7px 7px 0 0; display:flex; align-items:center; gap:5px; padding:0 12px; }
.future-scene__screen-head span {width:5px;height:5px;border-radius:50%;background:#fcce37;}
.future-scene__screen-head span:nth-child(2){background:#f35c79}.future-scene__screen-head span:nth-child(3){background:#78e8e2}
.future-scene__screen-body { height:84%;display:flex; background:#e4ecff;border-radius:0 0 6px 6px;overflow:hidden; }
.future-scene__nav { width:22%;background:linear-gradient(180deg,#243fba,#142976);padding:11px 8px;display:flex;flex-direction:column;gap:9px; }
.future-scene__nav i {height:7px;border-radius:4px;background:rgba(255,255,255,.28);}
.future-scene__nav i:first-child{background:#fcd116;}
.future-scene__content { flex:1;display:flex;gap:8%;padding:11%; }
.future-scene__skeleton{width:53%;display:flex;flex-direction:column;gap:10px;}
.future-scene__skeleton b{display:block;height:12%;border-radius:5px;background:#b5c8f9;}
.future-scene__skeleton b:nth-child(2){width:76%;background:#edbd4c}.future-scene__skeleton b:nth-child(3){width:91%;}
.future-scene__chart { width:42%;height:75%;display:flex;align-items:flex-end;gap:6px;}
.future-scene__chart i {flex:1;border-radius:3px 3px 0 0;background:linear-gradient(#7098fc,#3158c8);height:35%;animation:chartGrow 3s ease-in-out infinite alternate;}
.future-scene__chart i:nth-child(2){height:58%;animation-delay:.3s}.future-scene__chart i:nth-child(3){height:78%;animation-delay:.5s}.future-scene__chart i:nth-child(4){height:100%;animation-delay:.8s}
.future-scene__keyboard {height:13%;width:111%;margin-left:-6%;background:linear-gradient(#759dff,#233d9e);clip-path:polygon(5% 0,95% 0,100% 100%,0 100%);border-radius:0 0 8px 8px;box-shadow:0 6px 13px rgba(61,137,255,.6)}
.future-scene__tile {position:absolute;width:58px;height:58px;display:grid;place-items:center;border-radius:15px;border:1px solid rgba(255,255,255,.33);box-shadow:0 13px 24px rgba(1,9,65,.32);animation:tileFloat 4.5s ease-in-out infinite;transition:scale .2s,filter .2s;}
.future-scene__tile:hover{scale:1.12;filter:brightness(1.2)}
.future-scene__tile--people{top:10%;left:40%;background:linear-gradient(135deg,#457cff,#2647bf)}
.future-scene__tile--process{top:27%;right:4%;background:linear-gradient(135deg,#fd4574,#d71949);animation-delay:.8s}
.future-scene__tile--impact{right:1%;bottom:18%;background:linear-gradient(135deg,#ffe875,#e2aa16);color:#1d317e;animation-delay:1.5s}
.future-scene__star{position:absolute;width:9px;height:9px;border-radius:50%;background:#fcd116;box-shadow:0 0 15px #fcd116;animation:futureBreath 2.5s infinite}
.future-scene__star--a{top:12%;left:21%}.future-scene__star--b{bottom:19%;left:11%;background:#5ea5ff;box-shadow:0 0 16px #5ea5ff;animation-delay:.7s}.future-scene__star--c{right:12%;top:11%;background:#ff567b;box-shadow:0 0 14px #ff567b;animation-delay:1.3s}
.ictms-brand__message .future-title {font-size:clamp(31px,3.1vw,52px)!important;letter-spacing:-.045em!important;line-height:1.12!important;max-width:none!important;}
.future-title span {display:block;white-space:nowrap;}
.future-title span:first-child{color:#fff}.future-title span:last-child{color:#fcd116}
.ictms-brand__message .future-subtitle{font-size:clamp(13px,1.2vw,17px)!important;line-height:1.55!important;letter-spacing:normal!important;text-transform:none!important;white-space:normal;margin-top:13px;}
.ictms-brand__sub {max-width:320px;line-height:1.4;letter-spacing:.075em;text-transform:uppercase;}
@keyframes deviceFloat {0%,100%{transform:rotate(-4deg) skewY(2deg) translateY(0)}50%{transform:rotate(-3deg) skewY(2deg) translateY(-9px)}}
@keyframes tileFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
@keyframes futureBreath{0%,100%{opacity:.6}50%{opacity:1}}
@keyframes chartGrow{to{transform:scaleY(.72);transform-origin:bottom}}
@media(max-width:1120px){.ictms-brand__message .future-title{font-size:clamp(27px,4.8vw,42px)!important;}.future-scene{margin-inline:auto;}}
@media(max-width:600px){.future-scene{max-width:390px}.future-scene__tile{width:45px;height:45px}.ictms-brand__message .future-title{font-size:clamp(22px,6vw,34px)!important}}
@media(prefers-reduced-motion:reduce){.future-scene *, .future-scene, .future-scene::before, .future-scene::after {animation:none!important;transition:none!important}}

/* V31 – reference-inspired futuristic, balanced split auth */
.ictms-entry { padding: clamp(8px, 1.3vw, 22px); background: #eaf0ff; }
.ictms-entry__frame {
  width: min(100%, 1720px);
  min-height: min(910px, calc(100vh - 22px));
  grid-template-columns: minmax(0, 61.5%) minmax(0, 38.5%);
  border-radius: 28px;
  box-shadow: 0 26px 70px rgba(9, 27, 93, .16);
}
.ictms-brand {
  padding: clamp(28px, 3.3vw, 58px);
  background:
    radial-gradient(circle at 91% 3%, rgba(36, 119, 255, .72), transparent 25%),
    radial-gradient(ellipse at 72% 70%, rgba(18, 92, 255, .44), transparent 52%),
    linear-gradient(140deg, #061b5d 0%, #071d67 53%, #0b32a2 100%);
}
.ictms-brand::before { right: -260px; top: -505px; border-color: rgba(103,168,255,.42); box-shadow: 0 0 0 48px rgba(13,99,244,.065), 0 0 0 108px rgba(71,137,255,.035); }
.ictms-brand::after {
  inset: auto -10% -6% -15%; height: 40%;
  clip-path: none;
  background: radial-gradient(ellipse at 50% 100%, rgba(35,103,255,.15), transparent 67%);
  border-top: 2px solid rgba(64,160,255,.32);
  transform: rotate(-13deg);
  opacity: .8;
}
.ictms-brand__mark { background: linear-gradient(145deg,#386ce2,#18399a); box-shadow:0 0 28px rgba(57,138,255,.24); }
.ictms-brand__name { font-size:clamp(26px,2.35vw,39px); }
.ictms-brand__sub { max-width:390px; }
.ictms-brand__center {
  position: relative;
  width:100%;
  margin:auto 0;
  display:grid;
  align-items:center;
  grid-template-columns: minmax(0, 50%) minmax(0,50%);
  grid-template-areas: "text scene" "benefits scene";
  gap: 26px 2px;
  padding: 48px 0 42px;
}
.ictms-brand__message { grid-area:text; z-index:3; align-self:end; }
.ictms-brand__message .future-title { font-size:clamp(29px,3.05vw,55px)!important; line-height:1.13!important; }
.ictms-brand__message .future-subtitle { font-size:clamp(12px,1.12vw,18px)!important; white-space:nowrap; }
.ictms-brand__accent { margin:20px 0 14px; }
.future-scene {grid-area:scene; width:125%; max-width:none; align-self:center; margin:0 0 0 -17%; aspect-ratio:1.22; z-index:2; }
.future-scene__device {left:14%; top:24%; width:76%; height:63%; }
.future-scene__tile--people {left:35%; top:4%;}
.future-scene__tile--process {right:7%; top:19%;}
.future-scene__tile--impact {right:0;bottom:18%;}
.ictms-brand__benefits {grid-area:benefits; display:flex; gap:clamp(13px,2.2vw,34px); align-self:start; z-index:3; }
.ictms-benefit {display:flex; flex-direction:column; gap:10px; align-items:flex-start; color:#e2eaff; font-size:clamp(11px,.95vw,15px); line-height:1.3; font-weight:600; text-transform:capitalize; }
.ictms-benefit .q-icon { height:48px;width:48px;display:grid;place-items:center;border-radius:13px;border:1px solid rgba(255,255,255,.28);box-shadow:0 8px 24px rgba(3,10,55,.25);transition:transform .22s,filter .22s; }
.ictms-benefit:hover .q-icon {transform:translateY(-5px);filter:brightness(1.2);}
.ictms-benefit--people .q-icon {background:linear-gradient(135deg,#2e69ed,#183e9b);}
.ictms-benefit--process .q-icon {background:linear-gradient(135deg,#f03566,#b61948);}
.ictms-benefit--impact .q-icon {background:linear-gradient(135deg,#ffe070,#f1b51b);color:#15266d;}
.ictms-brand__footer {font-size:12px; opacity:.84;}
.ictms-entry__main { position:relative; background:linear-gradient(150deg,#fff 0%,#fff 70%,#f0f5ff 100%);}
.ictms-entry__content--login {padding:45px clamp(22px,3.6vw,70px);}
.ictms-entry__content--login .auth-card {max-width:420px;}
@media(max-width:1350px){
  .ictms-entry__frame {grid-template-columns:minmax(0,57%) minmax(0,43%);}
  .ictms-brand__center{grid-template-columns:minmax(0,1fr);grid-template-areas:"scene" "text" "benefits";gap:15px;padding:24px 0;}
  .future-scene{max-width:440px;width:100%;aspect-ratio:1.8;margin:0 auto;}
  .ictms-brand__message .future-title{font-size:clamp(29px,3.4vw,45px)!important;}
  .ictms-brand__benefits{gap:28px;margin-top:12px;}
}
@media(max-width:900px){
  .ictms-entry__frame{grid-template-columns:1fr;}
  .ictms-brand__center{grid-template-areas:"text" "benefits";gap:15px;padding:24px 0;}
  .future-scene{display:none;}
  .ictms-brand__message .future-title{font-size:clamp(27px,6.5vw,44px)!important;}
  .ictms-brand__message .future-subtitle{white-space:normal;}
  .ictms-brand__benefits{gap:22px;}
}
@media(max-width:520px){
  .ictms-brand__benefits{gap:12px;}
  .ictms-benefit{font-size:11px;}
  .ictms-benefit .q-icon{width:40px;height:40px;}
  .ictms-brand__message .future-title{font-size:clamp(25px,6.3vw,35px)!important;}
}
@media(prefers-reduced-motion:reduce){.ictms-benefit .q-icon{transition:none!important;}}


/* V32: softly layered right side, without changing other authentication pages. */
.ictms-entry__main:has(.ictms-entry__content--login) {
  background:
    radial-gradient(ellipse at 95% 4%,rgba(214,226,255,.28),transparent 38%),
    linear-gradient(155deg,#fff 20%,#fff 67%,#f4f8ff 100%);
  overflow:hidden;
}
.ictms-entry__main:has(.ictms-entry__content--login)::before {
  content:'';position:absolute;right:-18%;bottom:-23%;width:95%;height:47%;pointer-events:none;
  border-radius:50% 0 0 0;
  transform:rotate(-17deg);
  border-top:20px solid rgba(202,221,255,.22);
  box-shadow:0 -22px 0 rgba(247,205,77,.08),0 -44px 0 rgba(234,41,72,.05);
}
.ictms-entry__content--login {position:relative;z-index:1;}
/* V33: aligned brand accents underneath the supporting sentence. */
.ictms-brand__message {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
}
.ictms-brand__message .future-subtitle {
  margin: 18px 0 0;
  max-width: 100%;
  line-height: 1.55;
  letter-spacing: .015em;
  text-transform: none;
}
.ictms-brand__message .ictms-brand__accent {
  display: flex;
  align-items: center;
  align-self: flex-start;
  gap: 6px;
  margin: 16px 0 0;
  height: 4px;
}
.ictms-brand__message .ictms-brand__accent i {
  width: 58px;
  height: 4px;
  border-radius: 6px;
  background: #ee1a24;
}
.ictms-brand__message .ictms-brand__accent i:nth-child(2) {
  width: 30px;
  background: #fcd116;
}
.ictms-brand__message .ictms-brand__accent i:nth-child(3) {
  width: 46px;
  background: #aabcfb;
}
@media (max-width: 520px) {
  .ictms-brand__message .future-subtitle { white-space: normal; }
  .ictms-brand__message .ictms-brand__accent { margin-top: 13px; }
}

/* V40: Stable registration width when navigating between Login and Register. */
.ictms-entry__content--register {
  width: 100%;
  min-width: 0;
  padding-inline: clamp(18px, 2.6vw, 42px);
}
.ictms-entry__content--register .auth-card {
  width: 100%;
  max-width: 545px;
  min-width: 0;
  margin-inline: auto;
}
.ictms-entry__content--register .register-page {
  width: 100%;
  max-width: 545px;
  margin-inline: auto;
}
@media (max-width: 900px) {
  .ictms-entry__content--register { padding-inline: clamp(16px, 4vw, 36px); }
}

</style>

<style scoped lang="scss">
/* V34 — Quiet spiral decoration replacing the previous building grid. */
.ictms-brand__skyline { display: none !important; }
.ictms-brand__spiral {
  position: absolute;
  right: -155px;
  bottom: -195px;
  width: min(78%, 570px);
  aspect-ratio: 1;
  pointer-events: none;
  z-index: 0;
  opacity: .62;
  transform: rotate(-19deg);
  animation: spiralFloat 15s ease-in-out infinite alternate;
}
.ictms-brand__spiral-ring {
  position: absolute;
  display: block;
  border: 1px solid rgba(183, 206, 255, .28);
  border-radius: 50%;
  box-shadow: inset 0 0 42px rgba(84, 113, 238, .05);
}
.ictms-brand__spiral-ring--one { inset: 3%; border-top-color: rgba(235,240,255,.58); }
.ictms-brand__spiral-ring--two { inset: 14%; border-right-color: rgba(252,209,22,.52); }
.ictms-brand__spiral-ring--three { inset: 27%; border-left-color: rgba(240,40,70,.47); }
.ictms-brand__spiral-orbit {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: conic-gradient(from 40deg, transparent 0deg 95deg, rgba(119,178,255,.12) 145deg, transparent 190deg 360deg);
  animation: spiralRotate 22s linear infinite;
}
@keyframes spiralFloat {
  from { transform: rotate(-19deg) translate(0,0); }
  to { transform: rotate(-10deg) translate(-9px,-12px); }
}
@keyframes spiralRotate { to { transform: rotate(360deg); } }
@media(max-width:900px) {
  .ictms-brand__spiral { right:-100px; bottom:-120px; width:370px; opacity:.38; }
}
@media(prefers-reduced-motion:reduce) {
  .ictms-brand__spiral, .ictms-brand__spiral-orbit { animation:none!important; }
}

/* V40: Stable registration width when navigating between Login and Register. */
.ictms-entry__content--register {
  width: 100%;
  min-width: 0;
  padding-inline: clamp(18px, 2.6vw, 42px);
}
.ictms-entry__content--register .auth-card {
  width: 100%;
  max-width: 545px;
  min-width: 0;
  margin-inline: auto;
}
.ictms-entry__content--register .register-page {
  width: 100%;
  max-width: 545px;
  margin-inline: auto;
}
@media (max-width: 900px) {
  .ictms-entry__content--register { padding-inline: clamp(16px, 4vw, 36px); }
}

</style>

<style scoped lang="scss">
/* V37: clean login panel and simple DSWD tagline; no colored waves. */
.ictms-entry__main:has(.ictms-entry__content--login) {
  background: #fff;
}
.ictms-entry__main:has(.ictms-entry__content--login)::before {
  content: none !important;
  display: none !important;
}
.ictms-entry__content--login {
  position: relative;
  z-index: 1;
}
.login-bottom-art {
  position: absolute;
  inset: auto 0 0;
  height: 90px;
  z-index: 0;
  pointer-events: none;
}
.login-bottom-art__message {
  position: absolute;
  right: 28px;
  bottom: 21px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  color: #253a91;
  font-size: 10px;
  font-weight: 750;
  line-height: 1.4;
  letter-spacing: .12em;
  text-align: right;
}
.login-bottom-art__marks {
  display: flex;
  gap: 3px;
  margin-top: 8px;
}
.login-bottom-art__marks i {
  width: 27px;
  height: 3px;
  background: #fcd116;
}
.login-bottom-art__marks i:nth-child(2) { background: #ee1a24; }
.login-bottom-art__marks i:nth-child(3) { background: #2e3092; }
@media (max-width: 900px) {
  .login-bottom-art { position: relative; height: 90px; }
}
@media (max-width: 520px) {
  .login-bottom-art { height: 78px; }
  .login-bottom-art__message { right: 16px; bottom: 13px; font-size: 8px; }
}

/* V40: Stable registration width when navigating between Login and Register. */
.ictms-entry__content--register {
  width: 100%;
  min-width: 0;
  padding-inline: clamp(18px, 2.6vw, 42px);
}
.ictms-entry__content--register .auth-card {
  width: 100%;
  max-width: 545px;
  min-width: 0;
  margin-inline: auto;
}
.ictms-entry__content--register .register-page {
  width: 100%;
  max-width: 545px;
  margin-inline: auto;
}
@media (max-width: 900px) {
  .ictms-entry__content--register { padding-inline: clamp(16px, 4vw, 36px); }
}

</style>

<style scoped lang="scss">
/* Floating feature labels: beside each icon, no cursor. */
.future-scene__tile {
  padding: 0;
  margin: 0;
  font: inherit;
  color: #fff;
  cursor: pointer;
  z-index: 5;
  appearance: none;
  -webkit-appearance: none;
}
.future-scene__tile--impact { color: #1d317e; }
.future-scene__tile--revealed,
.future-scene__tile:focus-visible { z-index: 25; }
.future-scene__tile:focus-visible { outline: 2px solid #fcd116; outline-offset: 4px; }

.future-scene__tooltip {
  position: absolute;
  top: 50%;
  left: calc(100% + 12px);
  display: block;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,.22);
  padding: 9px 12px;
  color: #fff;
  background: rgba(10,26,91,.96);
  box-shadow: 0 12px 32px rgba(1,7,45,.35);
  visibility: hidden;
  opacity: 0;
  transform: translate(-7px,-50%);
  pointer-events: none;
  transition: opacity .2s ease, transform .2s ease, visibility .2s;
  white-space: nowrap;
}
.future-scene__tile--revealed .future-scene__tooltip,
.future-scene__tile:hover .future-scene__tooltip,
.future-scene__tile:focus-visible .future-scene__tooltip {
  visibility: visible;
  opacity: 1;
  transform: translate(0,-50%);
}
/* Icons near the right edge reveal labels inward, avoiding clipping. */
.future-scene__tile--process .future-scene__tooltip,
.future-scene__tile--impact .future-scene__tooltip {
  left: auto;
  right: calc(100% + 12px);
  transform: translate(7px,-50%);
}
.future-scene__tile--process.future-scene__tile--revealed .future-scene__tooltip,
.future-scene__tile--impact.future-scene__tile--revealed .future-scene__tooltip,
.future-scene__tile--process:hover .future-scene__tooltip,
.future-scene__tile--impact:hover .future-scene__tooltip,
.future-scene__tile--process:focus-visible .future-scene__tooltip,
.future-scene__tile--impact:focus-visible .future-scene__tooltip {
  transform: translate(0,-50%);
}
.future-scene__typing {
  display: block;
  width: 0;
  overflow: hidden;
  white-space: nowrap;
  border: 0 !important;
  font-size: 12px;
  line-height: 1.3;
  font-weight: 700;
  letter-spacing: .01em;
}
.future-scene__tile--revealed .future-scene__typing,
.future-scene__tile:hover .future-scene__typing,
.future-scene__tile:focus-visible .future-scene__typing {
  animation: featureType .65s steps(var(--typing-steps),end) forwards;
}
@keyframes featureType { to { width: var(--label-width); } }
@media (prefers-reduced-motion: reduce) {
  .future-scene__tile--revealed .future-scene__typing,
  .future-scene__tile:hover .future-scene__typing,
  .future-scene__tile:focus-visible .future-scene__typing {
    animation: none !important;
    width: var(--label-width);
  }
  .future-scene__tooltip { transition: none; }
}

/* V40: Stable registration width when navigating between Login and Register. */
.ictms-entry__content--register {
  width: 100%;
  min-width: 0;
  padding-inline: clamp(18px, 2.6vw, 42px);
}
.ictms-entry__content--register .auth-card {
  width: 100%;
  max-width: 545px;
  min-width: 0;
  margin-inline: auto;
}
.ictms-entry__content--register .register-page {
  width: 100%;
  max-width: 545px;
  margin-inline: auto;
}
@media (max-width: 900px) {
  .ictms-entry__content--register { padding-inline: clamp(16px, 4vw, 36px); }
}


/* V41: Stable Login / Create Account route transition. */
.ictms-entry__content {
  width: 100%;
  min-width: 0;
  flex-direction: column;
}
.ictms-entry__content .auth-card {
  flex: 0 1 auto;
  min-width: 0;
  margin-inline: auto;
}
.ictms-entry__content--login .auth-card { width: 100%; max-width: 440px; }
.ictms-entry__content--register .auth-card { width: 100%; max-width: 545px; }
/* Fade and slide only: scaling makes form widths appear to shrink. */
.auth-page-enter-active,
.auth-page-leave-active {
  transition: opacity .22s ease, transform .22s ease;
}
.auth-page-enter-from { opacity: 0; transform: translateY(12px); }
.auth-page-leave-to { opacity: 0; transform: translateY(-8px); }
/* Ensure old global transition classes do not affect the new transition. */
@media (prefers-reduced-motion: reduce) {
  .auth-page-enter-active,
  .auth-page-leave-active { transition: none; }
}

/* V42: Fix login/register flash and shrinking seen during navigation.
   The card is stable; only its route content changes. */
.ictms-entry__content .auth-card,
.ictms-entry__content--login .auth-card,
.ictms-entry__content--register .auth-card {
  width: min(100%, 545px) !important;
  max-width: 545px !important;
  min-width: 0;
  margin-inline: auto;
  flex-shrink: 0;
}
/* Keep the login visually compact without shrinking the shared card. */
.ictms-entry__content .login-v32 {
  width: 100%;
  max-width: 430px;
  margin-inline: auto;
}
.ictms-entry__content .register-page {
  width: 100%;
  max-width: 545px;
  margin-inline: auto;
}
/* Disable competing page-entry animations that caused partial opacity and
   movement while the opposite route was leaving. Keep icon motion intact. */
.ictms-entry__content .login-v32,
.ictms-entry__content .register-page,
.ictms-entry__content .register-grid > * {
  animation: none !important;
}
@media (max-width: 600px) {
  .ictms-entry__content .auth-card { width: 100% !important; }
}
</style>
