require("module-alias/register");
require('dotenv').config();

const Koa = require('koa')
const app = new Koa()
const json = require('koa-json')
const onerror = require('koa-onerror')
const { koaBody } = require('koa-body');
const logger = require('koa-logger')

const swagger = require('@src/swagger/swagger')  // stores swagger.js, can be configured, I put it in the root directory
const { koaSwagger } = require('koa2-swagger-ui')

const router = require("@src/routers/index");
const wrapContext = require("@src/middlewares/wrap.context");
const setGlobalTokenMiddleware = require('@src/middlewares/setGlobalToken');

app.use(wrapContext);
// error handler 
onerror(app)

// middlewares
app.use(koaBody({
  multipart: true
}))
app.use(json())
app.use(logger())

app.use(async (ctx, next) => {
  console.log(`Request URL: ${ctx.url}`);
  await next();
});
const path = require('path');

const publicPath = path.join(__dirname, '../public');
// Serve static files but prevent caching of the main HTML file so
// the browser always requests the latest version after each deployment.
app.use(async (ctx, next) => {
  await next();
  if (ctx.path === '/' || ctx.path.endsWith('index.html')) {
    ctx.set('Cache-Control', 'no-cache');
  }
});

app.use(require('koa-static')(publicPath))

// logger
app.use(async (ctx, next) => {
  const start = Date.now()
  await next()
  const ms = Date.now() - start
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
})

app.use(setGlobalTokenMiddleware);

// routes
app.use(router)
app.use(swagger.routes());
app.use(swagger.allowedMethods());
app.use(koaSwagger({
  routePrefix: '/swagger', // interface documentation access address
  swaggerOptions: {
    url: '/swagger.json', // example path to json 其实就是之后swagger-jsdoc生成的文档地址
  }
}))


// error-handling
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx)
});

module.exports = app
