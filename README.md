# gRPC Todo Application

A simple Todo application built with gRPC and Node.js that demonstrates the implementation of various RPC methods including unary calls and server-side streaming.

## Table of Contents

- [Project Overview](#project-overview)
- [Project Structure](#project-structure)
- [Protocol Buffer Definition](#protocol-buffer-definition)
- [Server Implementation](#server-implementation)
- [Client Implementation](#client-implementation)
- [Setup and Installation](#setup-and-installation)
- [Running the Application](#running-the-application)
- [Best Practices](#best-practices)
- [Extending the Application](#extending-the-application)

## Project Overview

This project demonstrates how to build a simple Todo application using gRPC (Google Remote Procedure Call), a high-performance, open-source universal RPC framework. The application allows users to create todos and retrieve them either as a single response or as a stream of data.

## Project Structure

```
├── .gitignore          # Git ignore file to exclude node_modules
├── README.md           # This documentation file
├── client.js           # gRPC client implementation
├── package-lock.json   # NPM package lock file
├── package.json        # NPM package configuration
├── server.js           # gRPC server implementation
└── todo.proto          # Protocol Buffer definition file
```

## Protocol Buffer Definition

The `todo.proto` file defines the service interface and message types using Protocol Buffers.

```proto
syntax = "proto3";

package todoPackage;

service Todo {
  rpc createTodo(Text) returns (TodoItem);         // Unary RPC
  rpc getTodos(NoParameters) returns (TodoItems);    // Unary RPC
  rpc getTodosStream(NoParameters) returns (stream TodoItem); // Server streaming RPC
}

message TodoItem {
  int32 id = 1;    // Unique identifier for the todo item
  string text = 2; // Content of the todo item
}

message Text {
  string text = 1; // Input text for creating a todo
}

message TodoItems {
  repeated TodoItem todoItems = 1; // Collection of todo items
}

message NoParameters {} // Empty message for methods that don't require parameters
```

### Line-by-Line Explanation of todo.proto

1. `syntax = "proto3";` - Specifies that we're using Protocol Buffers version 3 syntax.
2. `package todoPackage;` - Defines the namespace for this proto definition to avoid name conflicts.
3. `service Todo {...}` - Defines a service named "Todo" that contains RPC methods.
4. `rpc createTodo(Text) returns (TodoItem);` - Defines a unary RPC method that takes a Text message and returns a TodoItem.
5. `rpc getTodos(NoParameters) returns (TodoItems);` - Defines a unary RPC method that takes no parameters and returns multiple TodoItems.
6. `rpc getTodosStream(NoParameters) returns (stream TodoItem);` - Defines a server streaming RPC method that returns a stream of TodoItems.
7. `message TodoItem {...}` - Defines the structure for a todo item with an ID and text content.
8. `int32 id = 1;` - Defines a 32-bit integer field with field number 1.
9. `string text = 2;` - Defines a string field with field number 2.
10. `message Text {...}` - Defines the structure for the input text when creating a todo.
11. `message TodoItems {...}` - Defines a container for multiple TodoItem objects.
12. `repeated TodoItem todoItems = 1;` - Defines a repeated field (array) of TodoItem objects.
13. `message NoParameters {}` - Defines an empty message for methods that don't require input parameters.

## Server Implementation

The `server.js` file implements the gRPC server that handles client requests.

```javascript
import grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';

const PROTO_PATH = './todo.proto';
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const grpcTodoObject = grpc.loadPackageDefinition(packageDefinition);
const todoPackage = grpcTodoObject.todoPackage;

const server = new grpc.Server();

const todos = [];

function createTodo(call, callback) {
  const newTodo = call.request;
  console.log("Creating new todo:", newTodo);
  const todo = { id: String(todos.length + 1), text: newTodo.text };
  todos.push(todo);
  callback(null, todo);
}

function getTodos(call, callback) {
    console.log("Fetching all todos");
    const todoItems = {
        todos: todos.map(todo => ({ id: todo.id, text: todo.text })),
    }
  callback(null, todoItems);
}

function getTodosStream(call) {
  console.log("Streaming all todos");
  todos.forEach(todo => {
    call.write(todo);
  });
  call.end();
}

server.addService(todoPackage.Todo.service, {
  "createTodo": createTodo,
  "getTodos": getTodos,
  "getTodosStream": getTodosStream
});

server.bindAsync("127.0.0.1:50051", grpc.ServerCredentials.createInsecure(), (error, port) => {
  if (error) {
    console.error("Error binding server:", error);
  } else {
    console.log("🚀 Server running at http://127.0.0.1:50051");
    server.start();
  }
});
```

### Line-by-Line Explanation of server.js

1. `import grpc from '@grpc/grpc-js';` - Imports the gRPC library for Node.js.
2. `import * as protoLoader from '@grpc/proto-loader';` - Imports the proto loader library to load and parse proto files.
3. `const PROTO_PATH = './todo.proto';` - Defines the path to the proto file.
4. `const packageDefinition = protoLoader.loadSync(PROTO_PATH, {...});` - Loads the proto file synchronously with specific options.
5. `keepCase: true,` - Preserves the field names as they are defined in the proto file.
6. `longs: String,` - Converts int64 values to strings to avoid precision loss.
7. `enums: String,` - Represents enum values as strings.
8. `defaults: true,` - Sets default values for missing fields.
9. `oneofs: true,` - Sets virtual oneof properties to the present field's name.
10. `const grpcTodoObject = grpc.loadPackageDefinition(packageDefinition);` - Loads the package definition into a gRPC object.
11. `const todoPackage = grpcTodoObject.todoPackage;` - Extracts the todoPackage namespace from the gRPC object.
12. `const server = new grpc.Server();` - Creates a new gRPC server instance.
13. `const todos = [];` - Initializes an empty array to store todos (in-memory database).
14. `function createTodo(call, callback) {...}` - Implements the createTodo RPC method.
15. `const newTodo = call.request;` - Extracts the request data from the call object.
16. `console.log("Creating new todo:", newTodo);` - Logs the new todo for debugging.
17. `const todo = { id: String(todos.length + 1), text: newTodo.text };` - Creates a new todo object with an auto-incremented ID.
18. `todos.push(todo);` - Adds the new todo to the in-memory array.
19. `callback(null, todo);` - Sends the response back to the client (null for no error, todo as the response).
20. `function getTodos(call, callback) {...}` - Implements the getTodos RPC method.
21. `console.log("Fetching all todos");` - Logs the action for debugging.
22. `const todoItems = { todos: todos.map(todo => ({ id: todo.id, text: todo.text })) }` - Creates a response object with all todos.
23. `callback(null, todoItems);` - Sends the response back to the client.
24. `function getTodosStream(call) {...}` - Implements the getTodosStream RPC method.
25. `console.log("Streaming all todos");` - Logs the action for debugging.
26. `todos.forEach(todo => { call.write(todo); });` - Writes each todo to the stream one by one.
27. `call.end();` - Ends the stream after all todos have been sent.
28. `server.addService(todoPackage.Todo.service, {...});` - Adds the service implementation to the server.
29. `"createTodo": createTodo,` - Maps the createTodo RPC method to its implementation.
30. `"getTodos": getTodos,` - Maps the getTodos RPC method to its implementation.
31. `"getTodosStream": getTodosStream` - Maps the getTodosStream RPC method to its implementation.
32. `server.bindAsync("127.0.0.1:50051", grpc.ServerCredentials.createInsecure(), (error, port) => {...});` - Binds the server to a specific address and port.
33. `grpc.ServerCredentials.createInsecure()` - Creates insecure server credentials (not recommended for production).
34. `if (error) { console.error("Error binding server:", error); }` - Handles binding errors.
35. `else { console.log("🚀 Server running at http://127.0.0.1:50051"); server.start(); }` - Logs success and starts the server.

## Client Implementation

The `client.js` file implements the gRPC client that communicates with the server.

```javascript
import grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';

const PROTO_PATH = './todo.proto';

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const text = process.argv[2] || 'Hello, gRPC!';
const grpcTodoObject = grpc.loadPackageDefinition(packageDefinition);
const todoPackage = grpcTodoObject.todoPackage;
const client = new todoPackage.Todo('localhost:50051', grpc.credentials.createInsecure());

console.log(`Sending message: ${text}`);

const todoObject = {
    text: text,
};

client.createTodo(todoObject, (error, response) => {
    console.log('Received response:', JSON.stringify(response));
});

client.getTodos({}, (error, response) => { 
    console.log('All Todos:', JSON.stringify(response));
});

const call = client.getTodosStream();

call.on('data', (todo) => {
    console.log('Received todo from streaming:', todo);
});

call.on('end', () => {
    console.log('No more todos.');
});
```

### Line-by-Line Explanation of client.js

1. `import grpc from '@grpc/grpc-js';` - Imports the gRPC library for Node.js.
2. `import * as protoLoader from '@grpc/proto-loader';` - Imports the proto loader library.
3. `const PROTO_PATH = './todo.proto';` - Defines the path to the proto file.
4. `const packageDefinition = protoLoader.loadSync(PROTO_PATH, {...});` - Loads the proto file with specific options.
5. `const text = process.argv[2] || 'Hello, gRPC!';` - Gets the todo text from command line arguments or uses a default.
6. `const grpcTodoObject = grpc.loadPackageDefinition(packageDefinition);` - Loads the package definition.
7. `const todoPackage = grpcTodoObject.todoPackage;` - Extracts the todoPackage namespace.
8. `const client = new todoPackage.Todo('localhost:50051', grpc.credentials.createInsecure());` - Creates a client instance.
9. `console.log(`Sending message: ${text}`);` - Logs the message being sent.
10. `const todoObject = { text: text, };` - Creates a todo object with the provided text.
11. `client.createTodo(todoObject, (error, response) => {...});` - Calls the createTodo RPC method.
12. `console.log('Received response:', JSON.stringify(response));` - Logs the response from the server.
13. `client.getTodos({}, (error, response) => {...});` - Calls the getTodos RPC method with an empty object as parameters.
14. `console.log('All Todos:', JSON.stringify(response));` - Logs all todos received from the server.
15. `const call = client.getTodosStream();` - Initiates a streaming call to getTodosStream.
16. `call.on('data', (todo) => {...});` - Sets up a listener for each todo received in the stream.
17. `console.log('Received todo from streaming:', todo);` - Logs each todo as it's received.
18. `call.on('end', () => {...});` - Sets up a listener for the end of the stream.
19. `console.log('No more todos.');` - Logs when the stream has ended.

## Setup and Installation

### Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)

### Installation Steps

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd grpc-todo-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Running the Application

1. Start the server:
   ```bash
   node server.js
   ```

2. In a separate terminal, run the client with an optional todo text:
   ```bash
   node client.js "Buy groceries"
   ```

   If no text is provided, it will use the default "Hello, gRPC!" message.

## Best Practices

### Protocol Buffer Best Practices

1. **Version Your Protocol Buffers**: Use versioning in your package names (e.g., `todo.v1`) to allow for future changes without breaking existing clients.

2. **Field Numbers**: Once assigned, field numbers should never be changed or reused to maintain backward compatibility.

3. **Use Required Fields Sparingly**: In proto3, all fields are optional by default. Be cautious when making fields required in your application logic.

4. **Define Clear Message Structures**: Keep message definitions clear and focused on a single purpose.

5. **Use Comments**: Document your proto files thoroughly to help other developers understand the purpose of each service and message.

### gRPC Server Best Practices

1. **Error Handling**: Implement proper error handling in all RPC methods to provide meaningful error messages to clients.

2. **Logging**: Use structured logging to track requests and responses for debugging and monitoring.

3. **Security**: In production, always use secure credentials instead of `createInsecure()`.

4. **Validation**: Validate input data before processing to prevent security vulnerabilities and data corruption.

5. **Resource Management**: Properly manage resources, especially for streaming RPCs, to avoid memory leaks.

### gRPC Client Best Practices

1. **Connection Management**: Reuse client instances when possible to avoid the overhead of creating new connections.

2. **Timeouts**: Set appropriate timeouts for RPC calls to handle network issues gracefully.

3. **Error Handling**: Implement proper error handling for all RPC calls to handle server errors and network issues.

4. **Streaming**: For streaming RPCs, handle 'error' events in addition to 'data' and 'end' events.

5. **Graceful Shutdown**: Properly close client connections when they are no longer needed.

## Extending the Application

### Adding New RPC Methods

1. Define new RPC methods in the `todo.proto` file.
2. Implement the corresponding methods in the server.
3. Add client code to call the new methods.

### Adding Persistence

Currently, the application uses an in-memory array to store todos. To add persistence:

1. Integrate a database like MongoDB, PostgreSQL, or SQLite.
2. Modify the server implementation to store and retrieve todos from the database.
3. Add error handling for database operations.

### Adding Authentication

To add authentication:

1. Define authentication metadata in the proto file.
2. Implement middleware on the server to validate authentication tokens.
3. Modify the client to include authentication tokens in requests.

### Adding Client-Side Streaming

To implement client-side streaming:

1. Define a client streaming RPC method in the proto file.
2. Implement the method on the server to handle a stream of client requests.
3. Modify the client to send a stream of data to the server.

### Adding Bidirectional Streaming

To implement bidirectional streaming:

1. Define a bidirectional streaming RPC method in the proto file.
2. Implement the method on the server to handle a stream of client requests and send a stream of responses.
3. Modify the client to send and receive streams of data.

---

This README provides a comprehensive guide to understanding, running, and extending the gRPC Todo application. By following the explanations and best practices outlined here, you can build robust and efficient gRPC-based applications.