import { Injectable } from '@angular/core';
import { AngularFireDatabaseModule, AngularFireDatabase, FirebaseListObservable } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { Router } from "@angular/router";
import * as firebase from 'firebase';

@Injectable()
export class AuthService {

	authState: firebase.User = null;

  constructor(private afAuth: AngularFireAuth,
              private db: AngularFireDatabase,
              private router:Router) {

  	this.afAuth.authState.subscribe((auth) => {
  		this.authState = auth;
  	});
  }

  get authenticated(): boolean {
  	return this.authState !== null;
  }

  get currentUser(): any {
  	return this.authenticated ? this.authState : null;
  }

  get currentUserObservable(): any {
  	return this.afAuth.authState;
  }

  // Returns current user UID
	get currentUserId(): string {
	 return this.authenticated ? this.authState.uid : '';
	}

  get currentUserAnonymous(): boolean {
  	return this.authenticated ? this.authState.isAnonymous : false;
  }

  get currentUserDisplayName(): string {
  	if (!this.authState) { return 'Guest' }
  	else if (this.currentUserAnonymous) { return 'Anonymous'}
  	else { return this.authState['displayName'] || 'User without a Name' }
  }

	/// Social Auth ///

	googleLogin() {
	  const provider = new firebase.auth.GoogleAuthProvider()
	  return this.socialSignIn(provider);
	}

	private socialSignIn(provider) {
	  return this.afAuth.auth.signInWithPopup(provider)
	    .then((credential) =>  {
	        this.authState = credential.user
	        this.updateUserData()
	    })
	    .catch(error => console.log(error));
	}

	//// Email/Password Auth ////

	emailSignUp(email:string, password:string) {
	  return this.afAuth.auth.createUserWithEmailAndPassword(email, password)
	    .then((user) => {
	      this.authState = user
	      this.updateUserData()
	    })
	    .catch(error => console.log(error));
	}

	anonymousLogin() {
		return this.afAuth.auth.signInAnonymously()
			.then(() => console.log("successful login"))
			.catch(error => console.log(error));

	}

	anonymousUpgrade() {
		// const anonId = this.currentUserId;

		// // login with google
		// return this.googleLogin().then( () => {
		// 	// get the anonymous data snapshot
		// 	this.db.object(anonId).subscribe(snapshot => {
		// 		// map the anonymous user data to the new account.
		// 		this.db.object(this.currentUserId).update(snapshot);
		// 	})
		// });

		const provider = new firebase.auth.GoogleAuthProvider();
		//firebase.auth().currentUser.linkWithPopup(provider);
		this.authState.linkWithPopup(provider);
	}

	emailLogin(email:string, password:string) {
	   return this.afAuth.auth.signInWithEmailAndPassword(email, password)
	     .then((user) => {
	       this.authState = user
	       this.updateUserData()
	     })
	     .catch(error => console.log(error));
	}

	// Sends email allowing user to reset password
	resetPassword(email: string) {
	  var auth = firebase.auth();

	  return auth.sendPasswordResetEmail(email)
	    .then(() => console.log("email sent"))
	    .catch((error) => console.log(error))
	}


	//// Sign Out ////

	signOut(): void {
	  this.afAuth.auth.signOut();
	  this.router.navigate(['/'])
	}


	//// Helpers ////

	private updateUserData(): void {
		// Writes user name and email to realtime db
		// useful if your app displays information about users or for admin features

	  let path = `users/${this.currentUserId}`; // Endpoint on firebase
	  let data = {
	                email: this.authState.email,
	                name: this.authState.displayName
	              }

	  this.db.object(path).update(data)
	  .catch(error => console.log(error));

	}


}
