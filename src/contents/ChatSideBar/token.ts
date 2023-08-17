
export type AuthInfo = {
    login: number;
    guestTryTimes: number;
    userTryTimes: number;
    vip: number;
}

export class Token {
    private accessToken: string;
    private user: AuthInfo;

    constructor(user: AuthInfo, tokenString: string | null = null) {
        this.user = {...user};
        this.accessToken = tokenString?? this.create(user);
    }

    public get(): string {
        return this.accessToken;
    }

    public static fromString(accessToken: string): Token {
        const result = accessToken.split('');
        return new Token( {
            login: parseInt(result[2]),
            guestTryTimes: parseInt(result[7]),
            userTryTimes: parseInt(result[10]),
            vip: parseInt(result[14]),
        }, accessToken);
    }

    private create(user: AuthInfo): string {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        for (let i = 0; i < 30; i++) {
            if (i === 2) {
                result += user.login.toString();
            } else if (i === 7) {
                result += user.guestTryTimes.toString();
            } else if (i === 10) {
                result += user.userTryTimes.toString();
            } else if (i === 14) {
                result += user.vip.toString();
            } else {
                result += characters.charAt(Math.floor(Math.random() * charactersLength));
            }
        }
        return result;
    }

    public update(user: AuthInfo): string {
        this.user = {...user};
        const result = this.accessToken.split('');
        result[2] = user.login.toString();
        result[7] = user.guestTryTimes.toString();
        result[10] = user.userTryTimes.toString();
        result[14] = user.vip.toString();
        this.accessToken = result.join('');
        return this.accessToken;
    }

    public retrieve(): AuthInfo {
        return {...this.user};
    }

    public write():void {
        localStorage.setItem("auth_token", this.accessToken);
    }

}
