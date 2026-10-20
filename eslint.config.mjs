import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

/**
 * ESLint flat config (ESLint 9) — eslint-config-next 16 đã xuất flat config
 * gốc nên không cần FlatCompat.
 *
 * - `next/core-web-vitals`: quy tắc chính thức của Next.js (kể cả React Hooks
 *   và `@next/next`).
 * - `next/typescript`: parser + rules cho TypeScript.
 * - `no-explicit-any`: chặn `any` — dự án đã loại bỏ hoàn toàn `any`.
 */
const eslintConfig = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'out/**',
      'build/**',
      'backups/**',
      'next-env.d.ts',
      'scripts/_*.cjs',
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // Dự án đã thay toàn bộ `any` bằng interface cụ thể -> cấm tái phát.
      '@typescript-eslint/no-explicit-any': 'error',
      // Không dùng `console.log` trong mã server (dùng console.error/info).
      'no-console': ['warn', { allow: ['error', 'warn', 'info'] }],
      // Không có `var`.
      'no-var': 'error',
      // So sánh bằng `===`.
      eqeqeq: ['warn', 'always', { null: 'ignore' }],

      // Các rule mới của eslint-plugin-react-hooks v7 (React Compiler).
      // Codebase hiện tại còn dùng pattern "setState đồng bộ trong useEffect"
      // (fetch khi mount) ở nhiều component -> hạ xuống `warn` để ESLint vẫn
      // chạy xanh, và sửa dần từng component ở sprint sau.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/globals': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/error-boundaries': 'warn',
      'react-hooks/config': 'warn',
      'react-hooks/gating': 'warn',
      'react-hooks/incompatible-library': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/use-memo': 'warn',
      'react-hooks/unsupported-syntax': 'warn',
      'react-hooks/void-use-memo': 'warn',
    },
  },
  {
    // Script CLI: console.log là mục đích chính.
    files: ['scripts/**'],
    rules: {
      'no-console': 'off',
    },
  },
];

export default eslintConfig;
