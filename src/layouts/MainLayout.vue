<template>
    <div class="app-shell">
        <header class="topbar" ref="topbarRef">
            <div class="topbar-left">
                <router-link to="/dashboard" class="brand">{{ appName }}</router-link>
            </div>

            <div class="topbar-right">
                <!-- desktop actions -->
                <div class="actions-desktop">
                    <ThemeToggle @click="isMobileMenuOpen = false" />
                    <NotificationIcon @click="isMobileMenuOpen = false" />
                    <HeaderProfileDropdown @click="isMobileMenuOpen = false" />
                </div>

                <!-- mobile menu button -->
                <button class="mobile-menu-btn" @click="isMobileMenuOpen = !isMobileMenuOpen" aria-label="Toggle menu">
                    <span class="burger" :class="{ open: isMobileMenuOpen }"></span>
                </button>
            </div>

            <!-- mobile panel duplicated actions -->
                    <transition name="menu-slide">
                        <div v-if="isMobileMenuOpen" class="mobile-menu" @click.self="isMobileMenuOpen = false">
                            <div class="mobile-actions">
                                <ThemeToggle @click="isMobileMenuOpen = false" />
                                <NotificationIcon @click="isMobileMenuOpen = false" />
                                <HeaderProfileDropdown @click="isMobileMenuOpen = false" />
                            </div>
                        </div>
                    </transition>
        </header>

        <main class="main-content">
            <div class="container content-inner">
                <router-view v-slot="{ Component }">
                    <transition name="fade" mode="out-in">
                        <!-- Wrap the routed component in a single element so Transition has an element root to animate -->
                        <div class="route-view-wrapper" :key="$route.fullPath">
                            <component :is="Component" />
                        </div>
                    </transition>
                </router-view>
            </div>
        </main>

        <footer class="app-footer">
            <div class="container footer-inner">
                <p>&copy; 2025 Universitas Pertamina. All rights reserved.</p>
            </div>
        </footer>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import HeaderProfileDropdown from '@/components/HeaderProfileDropdown.vue'
import NotificationIcon from '@/components/NotificationIcon.vue'

// read app name from Vite env (VITE_APP_NAME). fallback to 'PRIMA'
const appName = import.meta.env.VITE_APP_NAME ?? 'PRIMA'

// mobile menu state
const isMobileMenuOpen = ref(false)
const topbarRef = ref(null)

// small helper: close mobile menu on ESC and outside clicks
onMounted(() => {
    const keyHandler = (e) => {
        if (e.key === 'Escape') isMobileMenuOpen.value = false
    }

    const clickHandler = (e) => {
        if (!isMobileMenuOpen.value) return
        const el = topbarRef.value
        if (!el) return
        if (!el.contains(e.target)) isMobileMenuOpen.value = false
    }

    window.addEventListener('keydown', keyHandler)
    document.addEventListener('click', clickHandler)

    // mark body so global #app constraints can be overridden for this layout
    document.body.classList.add('full-app-layout')

    // cleanup when the component unmounts
    onUnmounted(() => {
        window.removeEventListener('keydown', keyHandler)
        document.removeEventListener('click', clickHandler)
        document.body.classList.remove('full-app-layout')
    })
})
</script>

<style scoped>
.app-shell {
    display: flex;
    flex-direction: column;
    min-height: 100vh; /* fullscreen */
    color: var(--text-color);
    /* Use same base background token as AuthLayout so dark theme matches */
    background: var(--bg-0);
}

.topbar {
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    border-bottom: 1px solid rgba(0,0,0,0.06);
    background: var(--bg-0);
    position: sticky;
    top: 0;
    z-index: 40;
    backdrop-filter: blur(6px);
    box-shadow: 0 1px 0 rgba(0,0,0,0.04);
}

.topbar .brand {
    font-weight: 700;
    font-size: 18px;
    color: inherit;
    text-decoration: none;
}

.topbar-right { display:flex; align-items:center; gap:12px }

.actions-desktop { display:flex; align-items:center; gap:12px }

.mobile-menu-btn {
    display: none;
    width: 40px;
    height: 40px;
    border: none;
    background: transparent;
    padding: 6px;
    border-radius: 8px;
    cursor: pointer;
}

.burger {
    position: relative;
    display: block;
    width: 22px;
    height: 2px;
    background: var(--text-color);
}
.burger::before,
.burger::after {
    content: '';
    position: absolute;
    left: 0;
    width: 22px;
    height: 2px;
    background: var(--text-color);
    transition: transform .2s ease, top .2s ease, bottom .2s ease, opacity .2s ease;
}
.burger::before { top: -6px }
.burger::after { bottom: -6px }
.burger.open { background: transparent }
.burger.open::before { transform: translateY(6px) rotate(45deg) }
.burger.open::after { transform: translateY(-6px) rotate(-45deg) }

.mobile-menu {
    position: absolute;
    left: 0;
    right: 0;
    top: 64px;
    background: var(--bg-0);
    border-bottom: 1px solid rgba(0,0,0,0.06);
    z-index: 30;
    padding: 12px 20px;
    box-shadow: 0 6px 18px rgba(0,0,0,0.08);
}
.content-card {
    width: 100%;
    max-width: 900px;
    margin: 18px auto;
    padding: 18px 22px;
    background: var(--bg-0);
    border: 1px solid rgba(0,0,0,0.04);
    border-radius: 8px;
    box-shadow: 0 8px 30px rgba(0,0,0,0.04);
}
.mobile-actions { display:flex; gap:12px; align-items:center; justify-content:flex-start }

/* mobile menu animation */
.menu-slide-enter-active, .menu-slide-leave-active {
    transition: transform 220ms cubic-bezier(.2,.9,.3,1), opacity 180ms ease;
}
.menu-slide-enter-from { transform: translateY(-6px); opacity: 0 }
.menu-slide-enter-to { transform: translateY(0); opacity: 1 }
.menu-slide-leave-from { transform: translateY(0); opacity: 1 }
.menu-slide-leave-to { transform: translateY(-6px); opacity: 0 }

/* compress header content on very wide screens so brand/actions don't drift too far */
@media (min-width: 1700px) {
    .topbar { padding: 0 28px }
    .topbar-left, .topbar-right { max-width: 1600px; margin: 0 auto; width: 100% }
    .topbar { justify-content: center }
    .topbar-left { display:flex; justify-content:flex-start; flex:1 }
    .topbar-right { display:flex; justify-content:flex-end; flex:1 }
}

.main-content { flex:1; padding:16px 0; display:flex; align-items:flex-start }
.container { 
    max-width: 1600px; 
    margin: 0 auto; 
    padding: 0 24px; 
    width: 100%;
    overflow-x: hidden; /* Prevent horizontal scroll */
}
.content-inner { 
    min-height: calc(100vh - 64px - 68px); /* viewport minus header/footer */
    /* display: flex; */
    align-items: flex-start; /* change to flex-start to align content to top */
    justify-content: flex-start;
    padding-top: 0; /* remove top padding */
}

.app-footer { border-top: 1px solid rgba(0,0,0,0.06); padding: 18px 0; background: var(--bg-0) }
.footer-inner { display:flex; justify-content:center; align-items:center }

/* transitions */
.slide-fade-enter-active { transition: all .18s ease }
.slide-fade-leave-active { transition: all .12s ease }
.slide-fade-enter-from { transform: translateY(-6px); opacity: 0 }
.slide-fade-enter-to { transform: translateY(0); opacity: 1 }
.slide-fade-leave-from { transform: translateY(0); opacity: 1 }
.slide-fade-leave-to { transform: translateY(-6px); opacity: 0 }

/* Responsive tweaks */
@media (max-width: 768px) {
    .actions-desktop { display: none }
    .mobile-menu-btn { display: inline-flex }
    .topbar { padding: 0 12px }
    .topbar .brand { font-size: 16px }
    .main-content { padding: 18px 0 }
}

@media (max-width: 420px) {
    .mobile-actions { flex-direction: column; align-items: stretch }
}

</style>

<!-- Global dark-theme tweaks (not scoped) to make MainLayout tone match AuthLayout/LoginPage -->
<style>
/* use slightly lighter background in dark mode so layout isn't too deep-black */
html.dark .app-shell {
    background: var(--bg-0) !important;
}

/* topbar: softer backdrop and lighter border in dark theme */
html.dark .topbar {
    /* force identical visual band as footer in dark mode */
    background: var(--bg-1) !important;
    border-bottom: 1px solid var(--border-color) !important;
    box-shadow: none !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
}

/* make brand and small icons use slightly teal primary tone in dark mode */
html.dark .topbar .brand { color: var(--color-primary-400); }
html.dark .topbar .theme-toggle,
html.dark .topbar .notification-button,
html.dark .topbar .profile-button,
html.dark .topbar .burger,
html.dark .topbar .theme-toggle svg,
html.dark .topbar .profile-button svg {
    color: var(--color-primary-300);
}

/* ensure burger bars remain visible but softer */
html.dark .topbar .burger,
html.dark .topbar .burger::before,
html.dark .topbar .burger::after {
    background: rgba(255,255,255,0.85) !important;
}

/* mobile menu, content cards and footer adopt softer dark bg and lighter borders */
html.dark .mobile-menu,
html.dark .content-card,
html.dark .app-footer {
    background: var(--bg-1) !important;
    border-color: var(--border-color) !important;
}

/* ensure footer uses the same tonal band and border as header */
html.dark .app-footer {
    border-top: 1px solid var(--border-color) !important;
    background: var(--bg-1) !important;
    box-shadow: none !important;
}

</style>