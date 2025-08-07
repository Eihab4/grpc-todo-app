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
  callback(null, { todoItems: todos });
}

function getTodosStream(call) {
  console.log("Streaming all todos");
  todos.forEach(todo => {
    call.write(todo);
  });
  call.end();
}

server.addService(todoPackage.Todo.service, {
  createTodo,
  getTodos,
  getTodosStream
});

server.bindAsync("127.0.0.1:50051", grpc.ServerCredentials.createInsecure(), (error, port) => {
  if (error) {
    console.error("Error binding server:", error);
  } else {
    console.log("🚀 Server running at http://127.0.0.1:50051");
    server.start();
  }
});
