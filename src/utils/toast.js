import Swal from 'sweetalert2'

const baseToast = Swal.mixin({
  toast: true,
  position: 'bottom-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer)
    toast.addEventListener('mouseleave', Swal.resumeTimer)
  }
})

// Read primary color from CSS variable so it stays in sync with design tokens.
const getCssVar = (name, fallback) => {
  try {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
  } catch (e) {
    return fallback
  }
}

const toastTypes = {
  success: '#4CAF50',   // Green
  error: '#F44336',     // Red
  warning: '#FFC107',   // Orange
  info: '#2196F3',      // Blue
  secondary: '#6c757d', // Grey
  dark: '#343a40',      // Black
  primary: getCssVar('--color-primary-500', '#17a2b8'),   // Blue Primary (from CSS token)
}

const fontColor = {
  white: '#fff',
  black: '#000',
}

export const successToast = (message = 'Berhasil!') => {
  baseToast.fire({ icon: 'success', title: message, background: toastTypes.success, color: fontColor.white })
}

export const errorToast = (message = 'Terjadi kesalahan') => {
  baseToast.fire({ icon: 'error', title: message, background: toastTypes.error, color: fontColor.white })
}

export const warningToast = (message = 'Peringatan!') => {
  baseToast.fire({ icon: 'warning', title: message, background: toastTypes.warning, color: fontColor.black })
}

export const infoToast = (message = 'Informasi') => {
  baseToast.fire({ icon: 'info', title: message, background: toastTypes.info, color: fontColor.white })
}

export const customToast = (icon, message) => {
  baseToast.fire({ icon, title: message })
}