import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  where,
  limit,
  startAfter,
  getCountFromServer,
} from "firebase/firestore";
import { db } from "../cofig/FireBase";

const todoCollection = collection(db, "todos");

export const todoService = {
  async getStats(uid) {
    const base = where("uid", "==", uid);
    const [totSnap, actSnap, doneSnap] = await Promise.all([
      getCountFromServer(query(todoCollection, base)),
      getCountFromServer(
        query(todoCollection, base, where("completed", "==", false)),
      ),
      getCountFromServer(
        query(todoCollection, base, where("completed", "==", true)),
      ),
    ]);
    return {
      total: totSnap.data().count,
      active: actSnap.data().count,
      done: doneSnap.data().count,
    };
  },

  async fetchTodos({ uid, filter, search, targetCursor, pageSize }) {
    const constraints = [where("uid", "==", uid)];

    if (filter === "Active") constraints.push(where("completed", "==", false));
    if (filter === "Done") constraints.push(where("completed", "==", true));

    if (search?.trim()) {
      constraints.push(
        where("text", ">=", search),
        where("text", "<=", search + "\uf8ff"),
        orderBy("text"),
      );
    } else {
      constraints.push(orderBy("timestamp", "desc"));
    }

    if (targetCursor) constraints.push(startAfter(targetCursor));
    constraints.push(limit(pageSize));
                                                
    const q = query(todoCollection, ...constraints);
    const snapshot = await getDocs(q);

    return {
      data: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      lastDoc: snapshot.docs[snapshot.docs.length - 1],
    };
  },

  async add(uid, text) {
    return await addDoc(todoCollection, {
      text,
      completed: false,
      timestamp: serverTimestamp(),
      uid,
    });
  },

  async update(id, updates) {
     
    return await updateDoc(doc(db, "todos", id), updates);
  },

  async delete(id) {
     console.log("clicked on deleted btn:",id);
    return await deleteDoc(doc(db, "todos", id),
              console.log('succesfully deleted ')
         )
    ;
   
  },
};
