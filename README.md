# todo-userAuth
using firebase for authentication


make setup 
1 vite for react 
2 router for routing
3 toast of send toast 


so go to firbase and authenticaton 
 on email and password see many type of authentication are there 

 IN firebase file 
 import {getAuth} from "firebase/auth"
 export const auth= getAuth(); 

 then in handle submit i add auth  createUserWithEmailAndPassword(auth, email, password);
 that's it data goes in firebase . one cathc here if we need to see name or other detail then not seen bcz in firebase auth only give email password .
 so we use in that when we need to all data then clound firebase storage .
  we need to connect cloude storage so go to firebase 
     

