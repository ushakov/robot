import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios'
import config from 'config.json'

class Api {
    static instance?: Api
    private client!: AxiosInstance
    
    public createClient() {
        const headers = {}

        this.client = axios.create({
            baseURL: config.apibase,
            headers,
            withCredentials: true,
        })

        const errorHandler = (error: AxiosError): Promise<never> => {
            if (error.isAxiosError) {
                const response = error.response as AxiosResponse
                if (response?.data && typeof response.data === 'object') {
                    error.message = response.data.message
                }
            }

            if (error.response?.status === 422) {
                return Promise.reject(error.response?.data)
            }

            return Promise.reject(error)
        }

        this.client.interceptors.request.use(request => request, errorHandler)
        this.client.interceptors.response.use(response => response, errorHandler)
    }

    static getInstance() {
        if (!Api.instance) {
            Api.instance = new Api()
            Api.instance.createClient()
        }

        return Api.instance
    }
}

export default Api.getInstance()
