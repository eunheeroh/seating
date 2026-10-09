import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    // PWA: 홈 화면 설치 + 오프라인 실행 (플레이스토어 등록의 바탕)
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        id: './',
        name: '교실 자리배치',
        short_name: '자리배치',
        description: '같은 성별이 옆·앞뒤로 붙지 않게 학생 자리를 랜덤으로 배치하고, 인쇄·엑셀로 저장하는 선생님용 앱',
        lang: 'ko',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'any',
        background_color: '#f4fbf8',
        theme_color: '#3fb894',
        categories: ['education', 'productivity'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        // 엑셀 라이브러리까지 미리 저장해 두어 인터넷 없이도 모든 기능 사용
        globPatterns: ['**/*.{js,css,html,ico,png}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        runtimeCaching: [
          {
            // 구글 글꼴: 한 번 받으면 저장해 두고 사용
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      }
    })
  ],
  // 상대 경로로 빌드해서 GitHub Pages 하위 주소(/저장소이름/)에서도 동작
  base: './',
  // 엑셀 라이브러리(exceljs, xlsx)는 불러오기·저장할 때만 따로 내려받으므로 크기 경고를 완화
  build: { chunkSizeWarningLimit: 1000 }
});
