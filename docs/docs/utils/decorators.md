# Decorators Utilities

TypeScript decorators for Express.  
These utilities provide a declarative way to define Express routes, middleware, parameter extraction, response customization, and access control using TypeScript decorators.

## API Decorators Summary

- [**`registerControllers(router: Router, controllers: any[]): void`**](#registercontrollers) - Register all controller classes with the provided router.
- [**`@Controller(basePath: string): ClassDecorator`**](#controller) - Marks a class as a controller with a base path.
- [**`@Get(path: string): MethodDecorator`**](#get) - Define a route for the GET HTTP method.
- [**`@Post(path: string): MethodDecorator`**](#post) - Define a route for the POST HTTP method.
- [**`@Put(path: string): MethodDecorator`**](#put) - Define a route for the PUT HTTP method.
- [**`@Patch(path: string): MethodDecorator`**](#patch) - Define a route for the PATCH HTTP method.
- [**`@Delete(path: string): MethodDecorator`**](#delete) - Define a route for the DELETE HTTP method.
- [**`@Options(path: string): MethodDecorator`**](#options) - Define a route for the OPTIONS HTTP method.
- [**`@Head(path: string): MethodDecorator`**](#head) - Define a route for the HEAD HTTP method.
- [**`@Trace(path: string): MethodDecorator`**](#trace) - Define a route for the TRACE HTTP method.
- [**`@Connect(path: string): MethodDecorator`**](#connect) - Define a route for the CONNECT HTTP method.
- [**`@Use(...middlewares: RequestHandler[]): MethodDecorator`**](#use) - Apply Express middleware(s) to a route.
- [**`@Query(key?: string): ParameterDecorator`**](#query) - Extract query parameters from the request.
- [**`@Param(key?: string): ParameterDecorator`**](#param) - Extract route parameters from the request.
- [**`@Body(key?: string): ParameterDecorator`**](#body) - Extract body or body property from the request.
- [**`@Req(): ParameterDecorator`**](#req) - Extract the request object.
- [**`@Res(): ParameterDecorator`**](#res) - Extract the response object.
- [**`@HttpCode(status: number): MethodDecorator`**](#httpcode) - Set a custom HTTP status code for the response.
- [**`@Header(name: string, value: string): MethodDecorator`**](#header) - Add a custom HTTP header to the response.
- [**`@Before(fn: Function): MethodDecorator`**](#before) - Run a function before the route handler.
- [**`@After(fn: Function): MethodDecorator`**](#after) - Run a function after the route handler.
- [**`@Redirect(url?: string, statusCode?: number): MethodDecorator`**](#redirect) - Redirect to another URL.
- [**`@Roles(...roles: string[]): MethodDecorator`**](#roles) - Require specific roles for accessing a route.

---

## Main Methods Overview

These decorators and utilities allow you to:

- Define controllers and routes with HTTP methods and paths.
- Attach Express middleware to routes.
- Extract request parameters, query, body, and inject request/response objects.
- Set custom HTTP status codes and headers.
- Run hooks before and after route handlers.
- Restrict access to routes by user roles.
- Redirect requests to other URLs.
- Register controller classes with an Express router.

---

## Interfaces, Types and Enums

```ts
// Type for supported HTTP methods
type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'options' | 'head' | 'trace' | 'connect';

// Route definition for controller methods
interface RouteDefinition {
  path: string;
  method: HttpMethod;
  handlerName: string;
}

// Parameter decoration definition for method parameters
interface ParamDefinition {
  index: number;
  type: 'query' | 'param' | 'body' | 'req' | 'res';
  key?: string;
}

// Example enum for HTTP status codes
enum HttpStatusCodes {
  OK = 200,
  CREATED = 201,
  FORBIDDEN = 403,
  // ...other status codes
}
```

---

## Function Documentation & Usage Examples

### `registerControllers()`
Registers all controller classes with the provided router.

**Method Signature:**
```ts
function registerControllers(router: Router, controllers: any[]): void
```

**Parameters:**
- `router`: An Express router instance.
- `controllers`: An array of controller classes.

**Examples:**
```ts
import express, { Router } from 'express';
import { registerControllers } from '@catbee/utils';
import { ExampleController } from './controllers/example.controller';

const router: Router = express.Router();
registerControllers(router, [ExampleController]);
```

---

### `@Controller()`
Marks a class as a controller with a base path.

**Method Signature:**
```ts
@Controller(basePath: string): ClassDecorator
```

**Parameters:**
- `basePath`: The base path for all routes in the controller.

**Returns:** 
- A class decorator.

**Examples:**
```ts
import { Controller } from '@catbee/utils';

@Controller('/api')
class ExampleController {
  // Controller methods...
}
```

---

### `@Get()`
Defines a route for the GET HTTP method.

**Method Signature:**
```ts
@Get(path: string): MethodDecorator
```

**Parameters:**
- `path`: The route path.

**Returns:** 
- A method decorator.

**Examples:**
```ts
import { Get, Param } from '@catbee/utils';

@Get('/items/:id')
getItem(@Param('id') id: string) {
  return { id };
}
```

---

### `@Post()`
Defines a route for the POST HTTP method.

**Method Signature:**
```ts
@Post(path: string): MethodDecorator
```

**Parameters:**
- `path`: The route path.

**Returns:** 
- A method decorator.

**Examples:**
```ts
import { Post, Body } from '@catbee/utils';

@Post('/items')
createItem(@Body() item: any) {
  return { created: true, item };
}
```

---

### `@Put()`
Defines a route for the PUT HTTP method.

**Method Signature:**
```ts
@Put(path: string): MethodDecorator
```

**Parameters:**
- `path`: The route path.

**Returns:** 
- A method decorator.

**Examples:**
```ts
import { Put, Param, Body } from '@catbee/utils';

@Put('/items/:id')
updateItem(@Param('id') id: string, @Body() update: any) {
  return { id, ...update };
}
```

---

### `@Patch()`
Defines a route for the PATCH HTTP method.

**Method Signature:**
```ts
@Patch(path: string): MethodDecorator
```

**Parameters:**
- `path`: The route path.

**Returns:** 
- A method decorator.

**Examples:**
```ts
import { Patch, Param, Body } from '@catbee/utils';

@Patch('/items/:id')
patchItem(@Param('id') id: string, @Body() patch: any) {
  return { id, ...patch };
}
```

---

### `@Delete()`
Defines a route for the DELETE HTTP method.

**Method Signature:**
```ts
@Delete(path: string): MethodDecorator
```

**Parameters:**
- `path`: The route path.

**Returns:** 
- A method decorator.

**Examples:**
```ts
import { Delete, Param } from '@catbee/utils';

@Delete('/items/:id')
deleteItem(@Param('id') id: string) {
  return { deleted: true, id };
}
```

---

### `@Options()`
Defines a route for the OPTIONS HTTP method.

**Method Signature:**
```ts
@Options(path: string): MethodDecorator
```

**Parameters:**
- `path`: The route path.

**Returns:** 
- A method decorator.

**Examples:**
```ts
import { Options } from '@catbee/utils';

@Options('/items')
optionsItems() {
  return { allowed: ['GET', 'POST'] };
}
```

---

### `@Head()`
Defines a route for the HEAD HTTP method.

**Method Signature:**
```ts
@Head(path: string): MethodDecorator
```

**Parameters:**
- `path`: The route path.

**Returns:** 
- A method decorator.

**Examples:**
```ts
import { Head, Param } from '@catbee/utils';

@Head('/items/:id')
headItem(@Param('id') id: string) {
  // No body returned, just headers
}
```

---

### `@Trace()`
Defines a route for the TRACE HTTP method.

**Method Signature:**
```ts
@Trace(path: string): MethodDecorator
```

**Parameters:**
- `path`: The route path.

**Returns:** 
- A method decorator.

**Examples:**
```ts
import { Trace } from '@catbee/utils';

@Trace('/trace')
traceRoute() {
  return { traced: true };
}
```

---

### `@Connect()`
Defines a route for the CONNECT HTTP method.

**Method Signature:**
```ts
@Connect(path: string): MethodDecorator
```

**Parameters:**
- `path`: The route path.

**Returns:** 
- A method decorator.

**Examples:**
```ts
import { Connect } from '@catbee/utils';

@Connect('/connect')
connectRoute() {
  return { connected: true };
}
```

---

### `@Use()`
Applies Express middleware(s) to a route.

**Method Signature:**
```ts
@Use(...middlewares: RequestHandler[]): MethodDecorator
```

**Parameters:**
- `...middlewares`: One or more Express middleware functions.

**Returns:** 
- A method decorator.

**Examples:**
```ts
import { Use, Get, Req } from '@catbee/utils';
import { authMiddleware, loggingMiddleware } from './middlewares';

@Use(authMiddleware, loggingMiddleware)
@Get('/protected')
getProtected(@Req() req: any) {
  return { user: req.user };
}
```

---

### `@Query()`
Extracts query parameters from the request.

**Method Signature:**
```ts
@Query(key?: string): ParameterDecorator
```

**Parameters:**
- `key`: The query parameter key.

**Returns:** 
- A parameter decorator.

**Examples:**
```ts
import { Get, Query } from '@catbee/utils';

@Get('/search')
search(@Query('term') term: string) {
  return { results: [], term };
}
```

---

### `@Param()`
Extracts route parameters from the request.

**Method Signature:**
```ts
@Param(key?: string): ParameterDecorator
```

**Parameters:**
- `key`: The route parameter key.

**Returns:** 
- A parameter decorator.

**Examples:**
```ts
import { Get, Param } from '@catbee/utils';

@Get('/users/:id')
getUser(@Param('id') userId: string) {
  return { userId };
}
```

---

### `@Body()`
Extracts body or body property from the request.

**Method Signature:**
```ts
@Body(key?: string): ParameterDecorator
```

**Parameters:**
- `key`: The body property key.

**Returns:** 
- A parameter decorator.

**Examples:**
```ts
import { Post, Body } from '@catbee/utils';

@Post('/users')
createUser(@Body() userData: any) {
  return { created: true, userData };
}

@Post('/update')
updateName(@Body('name') name: string) {
  return { updated: true, name };
}
```

---

### `@Req()`
Injects the entire request object.

**Method Signature:**
```ts
@Req(): ParameterDecorator
```

**Returns:** 
- A parameter decorator.

**Examples:**
```ts
import { Get, Req } from '@catbee/utils';

@Get('/info')
info(@Req() req: any) {
  return { headers: req.headers };
}
```

---

### `@Res()`
Injects the response object.

**Method Signature:**
```ts
@Res(): ParameterDecorator
```

**Returns:** 
- A parameter decorator.

**Examples:**
```ts
import { Get, Res } from '@catbee/utils';

@Get('/custom')
custom(@Res() res: any) {
  res.status(201).send('Created');
}
```

---

### `@HttpCode()`
Sets a custom HTTP status code for the response.

**Method Signature:**
```ts
@HttpCode(status: number): MethodDecorator
```

**Parameters:**
- `status`: The HTTP status code.

**Returns:** 
- A method decorator.

**Examples:**
```ts
import { Post, HttpCode, Body } from '@catbee/utils';

@Post('/users')
@HttpCode(201)
createUser(@Body() userData: any) {
  return { id: '123', ...userData };
}
```

---

### `@Header()`
Adds a custom HTTP header to the response.

**Method Signature:**
```ts
@Header(name: string, value: string): MethodDecorator
```

**Parameters:**
- `name`: The name of the HTTP header.
- `value`: The value of the HTTP header.

**Returns:** 
- A method decorator.

**Examples:**
```ts
import { Get, Header } from '@catbee/utils';

@Get('/data')
@Header('Cache-Control', 'max-age=60')
getData() {
  return { data: '...' };
}
```

---

### `@Before()`
Runs a function before the route handler.

**Method Signature:**
```ts
@Before(fn: (req: Request, res: Response) => void): MethodDecorator
```

**Parameters:**
- `fn`: A function that takes the request and response objects.

**Returns:** 
- A method decorator.

**Examples:**
```ts
import { Before, Get, Param } from '@catbee/utils';

@Get('/users/:id')
@Before((req, res) => console.log(`Accessing user ${req.params.id}`))
getUser(@Param('id') id: string) {
  return { id };
}
```

---

### `@After()`
Runs a function after the route handler, can access the result.

**Method Signature:**
```ts
@After(fn: (req: Request, res: Response, result: any) => void): MethodDecorator
```

**Parameters:**
- `fn`: A function that takes the request, response, and result objects.

**Returns:** 
- A method decorator.

**Examples:**
```ts
import { After, Get, Param } from '@catbee/utils';

@Get('/users/:id')
@After((req, res, result) => console.log(`User data sent: ${JSON.stringify(result)}`))
getUser(@Param('id') id: string) {
  return { id, name: 'Example' };
}
```

---

### `@Roles()`
Requires specific roles for accessing a route.

**Method Signature:**
```ts
@Roles(...roles: string[]): MethodDecorator
```

**Parameters:**
- `...roles`: The roles required to access the route.

**Returns:** 
- A method decorator.

**Examples:**
```ts
import { Roles, Get } from '@catbee/utils';

@Get('/admin/settings')
@Roles('admin', 'superuser')
getSettings() {
  return { settings: ['a', 'b'] };
}
```

---

### `@Redirect()`
Redirects to another URL.

**Method Signature:**
```ts
@Redirect(url?: string, statusCode?: number): MethodDecorator
```

**Parameters:**
- `url`: The URL to redirect to.
- `statusCode`: The HTTP status code for the redirect.

**Returns:** 
- A method decorator.


**Examples:**
```ts
import { Get, Redirect } from '@catbee/utils';

@Get('/old-path')
@Redirect('/new-path', 301)
redirectToNewPath() {}

@Get('/dynamic-redirect')
@Redirect()
getDynamicRedirect() {
  return { url: '/calculated-path', statusCode: 307 };
}
```

