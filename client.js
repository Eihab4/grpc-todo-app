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
    id: -1,
    text: text,
};

client.createTodo(todoObject, (error, response) => {
    console.log('Received response:', JSON.stringify(response));
});