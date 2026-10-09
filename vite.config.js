import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // 상대 경로로 빌드해서 GitHub Pages 하위 주소(/저장소이름/)에서도 동작
  base: './',
  // 엑셀 라이브러리(exceljs, xlsx)는 불러오기·저장할 때만 따로 내려받으므로 크기 경고를 완화
  build: { chunkSizeWarningLimit: 1000 }
});
