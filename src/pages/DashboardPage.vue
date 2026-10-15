<template>
  <q-page class="workspace-page bento-dashboard">
    <div class="bento-dashboard__heading">
      <div class="section-kicker">WORKSPACE / OVERVIEW</div>
      <h1>Good to see you, {{ auth.user?.details?.first_name || auth.user?.username }}.</h1>
      <p>Your workspace, simplified.</p>
    </div>

    <div class="bento-dashboard__grid">
      <router-link to="/account" class="bento-dashboard__tile bento-dashboard__tile--hero" aria-label="Open my account">
        <div class="bento-dashboard__tile-top"><span>01 / YOUR SPACE</span><q-icon name="north_east" size="23px" /></div>
        <div><div class="bento-dashboard__hero-glyph"><q-icon name="space_dashboard" size="45px" /></div><h2>Everything in one place.</h2><p>View your account details and stay organized.</p></div>
        <div class="bento-dashboard__tile-bottom">Open account <q-icon name="east" /></div>
      </router-link>
      <router-link to="/account" class="bento-dashboard__tile bento-dashboard__tile--profile" aria-label="View profile">
        <div class="bento-dashboard__tile-top"><span>PROFILE</span><q-icon name="north_east" size="20px" /></div>
        <div class="bento-dashboard__tile-icon"><q-icon name="person_outline" size="30px" /></div>
        <div><h2>{{ auth.user?.username }}</h2><p class="text-break">{{ auth.user?.email }}</p></div>
      </router-link>
      <router-link to="/change-password" class="bento-dashboard__tile bento-dashboard__tile--security" aria-label="Manage security">
        <div class="bento-dashboard__tile-top"><span>SECURITY</span><q-icon name="north_east" size="20px" /></div>
        <div class="bento-dashboard__tile-icon"><q-icon name="verified_user" size="29px" /></div>
        <div><h2>Account security</h2><p>Manage your password.</p></div>
      </router-link>
      <div class="bento-dashboard__tile bento-dashboard__tile--note">
        <div class="bento-dashboard__tile-top"><span>ONE ICTMS</span><q-icon name="auto_awesome" size="20px" /></div>
        <h2>Better systems.<br />Better service.</h2>
        <div class="bento-dashboard__accent"><i /><i /></div>
      </div>
    </div>
  </q-page>
</template>
<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
const auth = useAuthStore()
</script>
<style scoped lang="scss">
.bento-dashboard__heading {margin-bottom:28px;}.bento-dashboard__heading h1 {font-size:clamp(2rem,3vw,3.1rem);font-weight:800;letter-spacing:-.055em;line-height:1.12;margin:10px 0 8px;}.bento-dashboard__heading p {margin:0;color:#77849a;font-size:15px;}
.bento-dashboard__grid {display:grid;grid-template-columns:repeat(4,minmax(0,1fr));grid-template-rows:repeat(2,minmax(210px,auto));gap:16px;}
.bento-dashboard__tile {display:flex;flex-direction:column;justify-content:space-between;min-width:0;border-radius:25px;padding:26px;text-decoration:none;border:1px solid #e5e8f2;background:#fff;box-shadow:0 10px 28px rgba(29,35,77,.035);transition:transform .3s cubic-bezier(.22,1,.36,1),box-shadow .3s,border-color .3s;animation:tileIn .65s both;}
.bento-dashboard__tile:hover,.bento-dashboard__tile:focus-visible {transform:translateY(-6px);box-shadow:0 20px 45px rgba(30,34,96,.12);border-color:#b8b7e0;outline:0;}.bento-dashboard__tile:nth-child(2){animation-delay:.07s}.bento-dashboard__tile:nth-child(3){animation-delay:.13s}.bento-dashboard__tile:nth-child(4){animation-delay:.20s}
.bento-dashboard__tile-top,.bento-dashboard__tile-bottom {display:flex;justify-content:space-between;align-items:center;gap:10px;font-size:11px;letter-spacing:.1em;font-weight:800;}.bento-dashboard__tile h2 {font-size:clamp(1.25rem,2vw,1.8rem);letter-spacing:-.04em;line-height:1.15;font-weight:800;margin:12px 0 8px;}.bento-dashboard__tile p {font-size:13px;line-height:1.55;color:#77849a;margin:0;}.bento-dashboard__tile--hero {grid-column:span 2;grid-row:span 2;min-height:435px;color:#fff;background:linear-gradient(142deg,#262a86,#474caa);border-color:transparent;}.bento-dashboard__tile--hero p {color:#e0e1fc;font-size:15px;max-width:270px}.bento-dashboard__tile--hero h2 {font-size:clamp(2.4rem,3.2vw,3.9rem);max-width:370px}.bento-dashboard__hero-glyph {height:74px;width:74px;border-radius:25px;display:grid;place-items:center;background:rgba(255,255,255,.15);margin-bottom:20px;}.bento-dashboard__tile-bottom {letter-spacing:0;font-size:14px;justify-content:flex-start;gap:9px;}.bento-dashboard__tile--profile {grid-column:span 1;}.bento-dashboard__tile--security {grid-column:span 1;background:#fff0f1;border-color:#f9d8dc;color:#a82a36;}.bento-dashboard__tile--security p{color:#9a6570;}.bento-dashboard__tile--note {grid-column:span 2;background:#fcd116;color:#292c75;border-color:#f2cd27;}.bento-dashboard__tile--note h2 {font-size:clamp(1.9rem,2.7vw,3.2rem);}.bento-dashboard__tile-icon {display:grid;place-items:center;width:55px;height:55px;border-radius:18px;background:#eef0ff;color:#393c9b;}.bento-dashboard__tile--security .bento-dashboard__tile-icon {background:#f7d8dd;color:#bb2f42;}.bento-dashboard__accent {display:flex;gap:6px}.bento-dashboard__accent i {height:4px;width:46px;border-radius:8px;background:#ee1a24}.bento-dashboard__accent i:last-child {width:22px;background:#343693}
@keyframes tileIn {from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
@media(max-width:1100px){.bento-dashboard__grid{grid-template-columns:repeat(2,minmax(0,1fr));}.bento-dashboard__tile--hero {grid-row:span 2}.bento-dashboard__tile--note{grid-column:span 2}}
@media(max-width:650px){.bento-dashboard__grid{grid-template-columns:1fr;grid-template-rows:auto;}.bento-dashboard__tile--hero,.bento-dashboard__tile--profile,.bento-dashboard__tile--security,.bento-dashboard__tile--note{grid-column:auto;grid-row:auto;min-height:200px;}.bento-dashboard__tile--hero{min-height:350px}.bento-dashboard__tile{padding:23px}}
@media(prefers-reduced-motion:reduce){.bento-dashboard__tile{animation:none!important;transition:none!important}}
</style>
