import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  serverTimestamp,
  Timestamp,
  addDoc,
  or,
  limit
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// User Services
export const userService = {
  async createUserProfile(user: any) {
    const path = `users/${user.uid}`;
    try {
      // Check if this is the first user
      const usersSnap = await getDocs(query(collection(db, 'users'), limit(1)));
      const isFirstUser = usersSnap.empty;

      await setDoc(doc(db, path), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'Anonymous',
        photoURL: user.photoURL || '',
        role: isFirstUser ? 'Admin' : 'Member',
        status: isFirstUser ? 'Approved' : 'Pending',
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async getUserProfile(uid: string) {
    const path = `users/${uid}`;
    try {
      const snap = await getDoc(doc(db, path));
      return snap.exists() ? snap.data() : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  },

  async updateUserProfile(uid: string, data: any) {
    const path = `users/${uid}`;
    try {
      await updateDoc(doc(db, path), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  getAllUsers(callback: (users: any[]) => void) {
    const path = `users`;
    const q = query(collection(db, path));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(doc => doc.data()));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  },

  async getUsersByUids(uids: string[]) {
    if (!uids.length) return [];
    const path = `users`;
    try {
      // Note: Firestore 'in' queries are limited to 30 elements
      const q = query(collection(db, path), where('uid', 'in', uids.slice(0, 30)));
      const snap = await getDocs(q);
      return snap.docs.map(doc => doc.data());
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  async getUserByEmail(email: string) {
    const path = `users`;
    try {
      const q = query(collection(db, path), where('email', '==', email));
      const snap = await getDocs(q);
      return snap.empty ? null : snap.docs[0].data();
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  }
};

// Project Services
export const projectService = {
  async createProject(name: string, description: string, status: string = 'Active') {
    const path = `projects`;
    const user = auth.currentUser;
    if (!user) throw new Error("Unauthorized");
    try {
      const newDocRef = doc(collection(db, path));
      await setDoc(newDocRef, {
        name,
        description,
        status,
        ownerId: user.uid,
        members: [user.uid],
        createdAt: serverTimestamp()
      });
      return newDocRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async updateMembers(projectId: string, members: string[]) {
    const path = `projects/${projectId}`;
    try {
      await updateDoc(doc(db, path), {
        members
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  getMyProjects(callback: (projects: any[]) => void) {
    const user = auth.currentUser;
    if (!user) return;
    const path = `projects`;
    // Removed orderBy to avoid requiring complex composite indexes for simple dashboard views
    const q = query(
      collection(db, path), 
      where('members', 'array-contains', user.uid)
    );

    return onSnapshot(q, (snapshot) => {
      const projects = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => {
          const timeA = a.createdAt?.toMillis?.() || 0;
          const timeB = b.createdAt?.toMillis?.() || 0;
          return timeB - timeA;
        });
      callback(projects);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  },

  async getProject(projectId: string) {
    const path = `projects/${projectId}`;
    try {
      const snap = await getDoc(doc(db, path));
      return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  },

  async deleteProject(projectId: string) {
    const path = `projects/${projectId}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
};

// Task Services
export const taskService = {
  async createTask(projectId: string, taskData: any) {
    const path = `tasks`;
    const user = auth.currentUser;
    if (!user) throw new Error("Unauthorized");
    try {
      const newDocRef = doc(collection(db, path));
      await setDoc(newDocRef, {
        status: 'To Do',
        ...taskData,
        projectId,
        creatorId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return newDocRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  getProjectTasks(projectId: string, callback: (tasks: any[]) => void) {
    const path = `tasks`;
    const q = query(
      collection(db, path),
      where('projectId', '==', projectId)
    );

    return onSnapshot(q, (snapshot) => {
      const tasks = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => {
          const timeA = a.createdAt?.toMillis?.() || 0;
          const timeB = b.createdAt?.toMillis?.() || 0;
          return timeB - timeA;
        });
      callback(tasks);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  },

  getAllMyTasks(callback: (tasks: any[]) => void) {
    const user = auth.currentUser;
    if (!user) return;
    const path = `tasks`;
    const q = query(
      collection(db, path),
      or(
        where('creatorId', '==', user.uid),
        where('assignedTo', 'array-contains', user.uid)
      )
    );

    return onSnapshot(q, (snapshot) => {
      const tasks = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => {
          const timeA = a.createdAt?.toMillis?.() || 0;
          const timeB = b.createdAt?.toMillis?.() || 0;
          return timeB - timeA;
        });
      callback(tasks);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  },

  async updateTaskStatus(taskId: string, status: string) {
    const path = `tasks/${taskId}`;
    try {
      await updateDoc(doc(db, path), {
        status,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async deleteTask(taskId: string) {
    const path = `tasks/${taskId}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
};

// Invitation Services
export const invitationService = {
  async createInvitation(projectId: string, email: string) {
    const path = `invitations`;
    try {
      const inviteRef = doc(collection(db, path));
      await setDoc(inviteRef, {
        projectId,
        email: email.toLowerCase(),
        inviterUid: auth.currentUser?.uid,
        createdAt: serverTimestamp()
      });
      return inviteRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  getProjectInvitations(projectId: string, callback: (invites: any[]) => void) {
    const path = `invitations`;
    const q = query(collection(db, path), where('projectId', '==', projectId));
    
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  },

  async deleteInvitation(inviteId: string) {
    const path = `invitations/${inviteId}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  async sendInviteEmail(email: string, projectName: string, inviterName: string, projectUrl: string) {
    try {
      const response = await fetch('/api/send-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, projectName, inviterName, projectUrl }),
      });
      return await response.json();
    } catch (error) {
      console.error("Failed to send invitation email:", error);
    }
  },

  async checkAndClaimInvitations() {
    const user = auth.currentUser;
    if (!user || !user.email) return;
    
    const email = user.email.toLowerCase();
    const path = `invitations`;
    try {
      const q = query(collection(db, path), where('email', '==', email));
      const snap = await getDocs(q);
      
      for (const invitationDoc of snap.docs) {
        const invite = invitationDoc.data();
        const projectPath = `projects/${invite.projectId}`;
        const projectSnap = await getDoc(doc(db, projectPath));
        
        if (projectSnap.exists()) {
          const projectData = projectSnap.data();
          const members = projectData.members || [];
          if (!members.includes(user.uid)) {
            await updateDoc(doc(db, projectPath), {
              members: [...members, user.uid]
            });
          }
        }
        // Delete invitation after claiming
        await deleteDoc(invitationDoc.ref);
      }
    } catch (error) {
      console.error("Failed to claim invitations:", error);
    }
  }
};
