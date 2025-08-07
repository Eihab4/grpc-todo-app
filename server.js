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

server.bind("127.0.0.1:50051", grpc.ServerCredentials.createInsecure());

server.addService(todoPackage.TodoService.service, {
    "createTodo": createTodo,
    "getTodos": getTodos,
    "getTodosStream": getTodosStream
});


server.start();
const todos = [];
function createTodo (call, callback) {
        const newTodo = call.request;
        console.log("Creating new todo:", newTodo);
        todos.push({ id: String(todos.length + 1), ...newTodo });
        callback(null, { id: String(todos.length), ...newTodo });
}

function getTodos(call, callback) {
    console.log("Fetching all todos");
    callback(null, { todos: todos });   
}

function getTodosStream(call, callback) { 
    console.log("Streaming all todos");
    todos.forEach(todo => {
        call.write(todo);
    });
    call.end();
}
