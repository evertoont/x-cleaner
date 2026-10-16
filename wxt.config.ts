import { defineConfig } from 'wxt'

export default defineConfig({
  imports: false,
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'X Cleaner',
    description: 'Review and bulk-remove your own posts, replies, reposts and likes on X.',
    permissions: ['storage', 'unlimitedStorage'],
    host_permissions: ['https://x.com/*'],
    action: {
      default_title: 'Open X Cleaner',
      default_icon: { 16: 'icon/16.png', 32: 'icon/32.png', 48: 'icon/48.png' },
    },
  },
})
