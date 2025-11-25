const colors = require('tailwindcss/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      // إعادة تعريف لون "الأخضر" ليستخدم لوحة الأزرق
      colors: {
        green: colors.blue,
      },
    },
  },
  plugins: [],
}

