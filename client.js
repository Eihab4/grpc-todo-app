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
