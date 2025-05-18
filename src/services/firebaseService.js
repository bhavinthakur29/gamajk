import { db } from '../firebase';
import { 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    setDoc, 
    updateDoc, 
    deleteDoc, 
    addDoc, 
    query, 
    where,
    orderBy,
    serverTimestamp
} from 'firebase/firestore';
import { CACHE_DURATION } from '../utils/constants';

// In-memory cache for Firebase data
const cache = {
    data: {},
    timestamp: {},
    isExpired: function(key, duration = CACHE_DURATION.SHORT) {
        if (!this.timestamp[key]) return true;
        return Date.now() - this.timestamp[key] > duration;
    },
    set: function(key, data) {
        this.data[key] = data;
        this.timestamp[key] = Date.now();
    },
    get: function(key) {
        return this.data[key];
    },
    invalidate: function(key) {
        delete this.data[key];
        delete this.timestamp[key];
    },
    invalidateCollection: function(collectionName) {
        Object.keys(this.data).forEach(key => {
            if (key.startsWith(collectionName)) {
                this.invalidate(key);
            }
        });
    }
};

/**
 * Generic Firestore service with caching capabilities
 */
export const firestoreService = {
    // Get a document by ID with caching
    async getDocument(collectionName, docId, forceFresh = false, cacheDuration = CACHE_DURATION.SHORT) {
        const cacheKey = `${collectionName}/${docId}`;
        
        // Return cached data if available and not expired
        if (!forceFresh && !cache.isExpired(cacheKey, cacheDuration) && cache.get(cacheKey)) {
            return cache.get(cacheKey);
        }
        
        // Fetch fresh data
        try {
            const docRef = doc(db, collectionName, docId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                const data = { id: docSnap.id, ...docSnap.data() };
                cache.set(cacheKey, data);
                return data;
            }
            return null;
        } catch (error) {
            console.error(`Error fetching document ${docId} from ${collectionName}:`, error);
            throw error;
        }
    },
    
    // Get all documents from a collection with caching
    async getCollection(collectionName, forceFresh = false, cacheDuration = CACHE_DURATION.SHORT) {
        const cacheKey = `${collectionName}/all`;
        
        // Return cached data if available and not expired
        if (!forceFresh && !cache.isExpired(cacheKey, cacheDuration) && cache.get(cacheKey)) {
            return cache.get(cacheKey);
        }
        
        // Fetch fresh data
        try {
            const querySnapshot = await getDocs(collection(db, collectionName));
            const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            cache.set(cacheKey, docs);
            return docs;
        } catch (error) {
            console.error(`Error fetching collection ${collectionName}:`, error);
            throw error;
        }
    },
    
    // Query documents with conditions
    async queryDocuments(collectionName, conditions = [], orderByField = null, isAsc = true, forceFresh = false, cacheDuration = CACHE_DURATION.SHORT) {
        // Create a unique cache key based on the query parameters
        const conditionsKey = conditions.map(c => `${c.field}:${c.operator}:${c.value}`).join('|');
        const orderKey = orderByField ? `${orderByField}:${isAsc ? 'asc' : 'desc'}` : 'none';
        const cacheKey = `${collectionName}/query/${conditionsKey}/${orderKey}`;
        
        // Return cached data if available and not expired
        if (!forceFresh && !cache.isExpired(cacheKey, cacheDuration) && cache.get(cacheKey)) {
            return cache.get(cacheKey);
        }
        
        try {
            // Build the query with conditions
            let q = collection(db, collectionName);
            
            if (conditions.length > 0) {
                const whereConditions = conditions.map(c => where(c.field, c.operator, c.value));
                q = query(q, ...whereConditions);
            }
            
            // Add orderBy if specified
            if (orderByField) {
                q = query(q, orderBy(orderByField, isAsc ? 'asc' : 'desc'));
            }
            
            const querySnapshot = await getDocs(q);
            const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            cache.set(cacheKey, docs);
            return docs;
        } catch (error) {
            console.error(`Error querying collection ${collectionName}:`, error);
            throw error;
        }
    },
    
    // Create a document with a specific ID
    async setDocument(collectionName, docId, data) {
        try {
            const docRef = doc(db, collectionName, docId);
            await setDoc(docRef, { ...data, updatedAt: serverTimestamp() });
            
            // Invalidate cache for this document and collection
            cache.invalidate(`${collectionName}/${docId}`);
            cache.invalidateCollection(collectionName);
            
            return { id: docId, ...data };
        } catch (error) {
            console.error(`Error setting document ${docId} in ${collectionName}:`, error);
            throw error;
        }
    },
    
    // Update an existing document
    async updateDocument(collectionName, docId, data) {
        try {
            const docRef = doc(db, collectionName, docId);
            await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
            
            // Invalidate cache for this document and collection
            cache.invalidate(`${collectionName}/${docId}`);
            cache.invalidateCollection(collectionName);
            
            return { id: docId, ...data };
        } catch (error) {
            console.error(`Error updating document ${docId} in ${collectionName}:`, error);
            throw error;
        }
    },
    
    // Create a new document with auto-generated ID
    async addDocument(collectionName, data) {
        try {
            const colRef = collection(db, collectionName);
            const docRef = await addDoc(colRef, { 
                ...data, 
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp() 
            });
            
            // Invalidate collection cache
            cache.invalidateCollection(collectionName);
            
            return { id: docRef.id, ...data };
        } catch (error) {
            console.error(`Error adding document to ${collectionName}:`, error);
            throw error;
        }
    },
    
    // Delete a document
    async deleteDocument(collectionName, docId) {
        try {
            const docRef = doc(db, collectionName, docId);
            await deleteDoc(docRef);
            
            // Invalidate cache for this document and collection
            cache.invalidate(`${collectionName}/${docId}`);
            cache.invalidateCollection(collectionName);
            
            return true;
        } catch (error) {
            console.error(`Error deleting document ${docId} from ${collectionName}:`, error);
            throw error;
        }
    },
    
    // Manually invalidate cache
    invalidateCache(collectionName, docId = null) {
        if (docId) {
            cache.invalidate(`${collectionName}/${docId}`);
        } else {
            cache.invalidateCollection(collectionName);
        }
    }
};

// Common collection-specific services
export const userService = {
    // Get user profile by ID
    async getUserProfile(userId, forceFresh = false) {
        return firestoreService.getDocument('users', userId, forceFresh);
    },
    
    // Update user profile
    async updateUserProfile(userId, data) {
        return firestoreService.updateDocument('users', userId, data);
    },
    
    // Get all instructors
    async getInstructors(forceFresh = false) {
        return firestoreService.queryDocuments('users', [
            { field: 'role', operator: '==', value: 'instructor' }
        ], 'fullName', true, forceFresh);
    }
};

export const studentService = {
    // Get all students, optionally filtered by branch
    async getStudents(branch = null, forceFresh = false) {
        const conditions = [];
        if (branch && branch !== 'All') {
            conditions.push({ field: 'branch', operator: '==', value: branch });
        }
        return firestoreService.queryDocuments('students', conditions, 'name', true, forceFresh);
    },
    
    // Add new student
    async addStudent(studentData) {
        return firestoreService.addDocument('students', studentData);
    },
    
    // Update student
    async updateStudent(studentId, data) {
        return firestoreService.updateDocument('students', studentId, data);
    },
    
    // Delete student
    async deleteStudent(studentId) {
        return firestoreService.deleteDocument('students', studentId);
    }
};

export const attendanceService = {
    // Record attendance for a batch
    async recordAttendance(attendanceData) {
        // Invalidate cache when recording new attendance
        firestoreService.invalidateCache('attendance_records');
        return firestoreService.addDocument('attendance_records', attendanceData);
    },
    
    // Get attendance records, optionally filtered by branch, date or month
    async getAttendanceRecords(branch = null, startDate = null, endDate = null, forceFresh = false, month = null) {
        console.log("Getting attendance records with params:", { branch, startDate, endDate, month });
        
        try {
            // To avoid Firestore index errors, we'll get all records and filter in memory
            const records = await firestoreService.getCollection('attendance_records', forceFresh);
            console.log(`Retrieved ${records.length} attendance records`);
            
            // Apply filters in memory
            let filtered = records;
            
            // Filter by branch if specified (this is important for instructors)
            if (branch && branch !== 'All') {
                console.log(`Filtering by branch: ${branch}`);
                filtered = filtered.filter(record => record.branch === branch);
                console.log(`After branch filter: ${filtered.length} records`);
            }
            
            // Filter by month if specified
            if (month) {
                filtered = filtered.filter(record => {
                    if (record.month) {
                        return record.month === month;
                    } else if (record.date) {
                        return record.date.substring(0, 7) === month;
                    }
                    return false;
                });
            }
            
            // Filter by date range if specified
            if (startDate && endDate) {
                filtered = filtered.filter(record => {
                    if (!record.date) return false;
                    return record.date >= startDate && record.date <= endDate;
                });
            }
            
            return filtered;
        } catch (error) {
            console.error("Error fetching attendance records:", error);
            return [];
        }
    },
    
    // Get attendance records for a specific month
    async getAttendanceByMonth(month, branch = null, forceFresh = false) {
        console.log("Getting attendance by month:", month, branch);
        
        try {
            // Get all records and filter in memory
            const records = await firestoreService.getCollection('attendance_records', forceFresh);
            let filtered = records;
            
            // Filter by month
            filtered = filtered.filter(record => {
                if (record.month) {
                    return record.month === month;
                } else if (record.date) {
                    return record.date.substring(0, 7) === month;
                }
                return false;
            });
            
            // Filter by branch if provided
            if (branch && branch !== 'All') {
                filtered = filtered.filter(record => record.branch === branch);
            }
            
            console.log(`Retrieved ${filtered.length} attendance records for month ${month}`);
            return filtered;
        } catch (error) {
            console.error("Error fetching attendance records by month:", error);
            return [];
        }
    },
    
    // Get all attendance records regardless of filters (for admin use)
    async getAllAttendanceRecords(forceFresh = false) {
        try {
            // If forceFresh is true, invalidate the cache first
            if (forceFresh) {
                firestoreService.invalidateCache('attendance_records');
            }
            
            const records = await firestoreService.getCollection('attendance_records', forceFresh);
            console.log(`Retrieved all ${records.length} attendance records`);
            return records;
        } catch (error) {
            console.error("Error fetching all attendance records:", error);
            return [];
        }
    }
}; 