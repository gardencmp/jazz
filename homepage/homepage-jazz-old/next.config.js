const withNextra = require('nextra')({
    theme: 'nextra-theme-docs',
    themeConfig: './theme.config.jsx',
    mdxOptions: {

    }
})

module.exports = withNextra()