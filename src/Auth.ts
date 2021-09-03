import React, { useState, useEffect, useContext } from "react";

import createAuth0Client, { Auth0Client, Auth0ClientOptions, User, RedirectLoginResult } from "@auth0/auth0-spa-js";
import { observable, action, runInAction } from "mobx";

import config from "config.json"

const DEFAULT_REDIRECT_CALLBACK = () =>
    window.history.replaceState({}, document.title, window.location.pathname);

export class AuthStore {
    @observable loading: boolean = false
    @observable popup: boolean = false;
    @observable isAuthenticated: boolean = false
    @observable user?: User

    initOptions: Auth0ClientOptions
    auth0?: Auth0Client
    onRedirectCallback: (RedirectLoginResult) => void = DEFAULT_REDIRECT_CALLBACK

    constructor(initOptions: Auth0ClientOptions, onRedirectCallback?: (RedirectLoginResult) => void) {
        this.initOptions = initOptions
        if (onRedirectCallback) {
            this.onRedirectCallback = onRedirectCallback
        }
    }

    async initialize() {
        this.setLoading(true)
        const auth0 = await createAuth0Client(this.initOptions)
        if (window.location.search.includes("code=") &&
            window.location.search.includes("state=")) {
            const { appState } = await auth0.handleRedirectCallback()
            this.onRedirectCallback(appState)
        }
        const isAuthenticated = await auth0.isAuthenticated()
        let user: User | undefined
        if (isAuthenticated) {
            user = await auth0.getUser();
        }
        runInAction("set Auth0 info", () => {
            this.auth0 = auth0
            this.isAuthenticated = isAuthenticated
            if (isAuthenticated) {
                this.user = user
            }
            this.loading = false
        })
    }

    loginWithPopup = async (params = {}) => {
        this.setPopup(true)
        try {
            await this.auth0!.loginWithPopup(params)
            const user = await this.auth0!.getUser()
            runInAction(() => {
                this.user = user
                this.isAuthenticated = true
            })
        } catch (error) {
            console.error("error", error)
        } finally {
            this.setPopup(false)
        }

    };

    @action
    setPopup(p: boolean) {
        this.popup = p
    }

    @action
    setLoading(p: boolean) {
        this.loading = p
    }

    handleRedirectCallback = async () => {
        this.setLoading(true)
        await this.auth0!.handleRedirectCallback();
        const user = await this.auth0!.getUser();
        runInAction(() => {
            this.loading = false
            this.isAuthenticated = true
            this.user = user
        })
    };

    getIdTokenClaims = (...p) => this.auth0!.getIdTokenClaims(...p)
    loginWithRedirect = (...p) => this.auth0!.loginWithRedirect(...p)
    getTokenSilently = (...p) => this.auth0!.getTokenSilently(...p)
    getTokenWithPopup = (...p) => this.auth0!.getTokenWithPopup(...p)
    logout = () => this.auth0!.logout({returnTo: config.base})
}