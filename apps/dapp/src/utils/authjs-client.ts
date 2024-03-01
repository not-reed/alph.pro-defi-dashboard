import type {
	BuiltInProviderType,
	RedirectableProviderType,
} from "@auth/core/providers";

const base = `${import.meta.env.VITE_API_ENDPOINT}/api`;

type LiteralUnion<T extends U, U = string> = T | (U & Record<never, never>);

interface SignInOptions extends Record<string, unknown> {
	/**
	 * Specify to which URL the user will be redirected after signing in. Defaults to the page URL the sign-in is initiated from.
	 *
	 * [Documentation](https://next-auth.js.org/getting-started/client#specifying-a-callbackurl)
	 */
	callbackUrl?: string;
	/** [Documentation](https://next-auth.js.org/getting-started/client#using-the-redirect-false-option) */
	redirect?: boolean;
}

interface SignOutParams<R extends boolean = true> {
	/** [Documentation](https://next-auth.js.org/getting-started/client#specifying-a-callbackurl-1) */
	callbackUrl?: string;
	/** [Documentation](https://next-auth.js.org/getting-started/client#using-the-redirect-false-option-1 */
	redirect?: R;
}

/** Match `inputType` of `new URLSearchParams(inputType)` */
export type SignInAuthorizationParams =
	| string
	| string[][]
	| Record<string, string>
	| URLSearchParams;

/**
 * Client-side method to initiate a signin flow
 * or send the user to the signin page listing all possible providers.
 * Automatically adds the CSRF token to the request.
 *
 * [Documentation](https://authjs.dev/reference/sveltekit/client#signin)
 */
export async function signIn<
	P extends RedirectableProviderType | undefined = undefined,
>(
	providerId?: LiteralUnion<
		P extends RedirectableProviderType
			? P | BuiltInProviderType
			: BuiltInProviderType
	>,
	options?: SignInOptions,
	authorizationParams?: SignInAuthorizationParams,
) {
	const { callbackUrl = window.location.href, redirect = false } =
		options ?? {};

	// TODO: Support custom providers
	const isCredentials = providerId === "credentials";
	const isEmail = providerId === "email";
	const isSupportingReturn = isCredentials || isEmail;

	const action = isCredentials ? "callback" : "signin";

	const signInUrl = `${base}/auth/${action}/${providerId}`;

	const _signInUrl = `${signInUrl}?${new URLSearchParams(authorizationParams)}`;

	// TODO: Remove this since Sveltekit offers the CSRF protection via origin check
	const csrfTokenResponse = await fetch(`${base}/auth/csrf`, {
		credentials: "include",
	});
	const { csrfToken } = await csrfTokenResponse.json();

	const res = await fetch(_signInUrl, {
		method: "post",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			"X-Auth-Return-Redirect": "1",
			"X-CSRF-TOKEN": csrfToken,
		},
		credentials: "include",
		body: new URLSearchParams({
			...options,
			redirect: redirect.toString(),
			csrfToken,
			callbackUrl,
		}),
	});

	const data = await res.clone().json();

	if (redirect || !isSupportingReturn) {
		// TODO: Do not redirect for Credentials and Email providers by default in next major
		// window.location.href = data.url ?? callbackUrl;
		// console.log(new URL(data.url ?? callbackUrl).pathname);
		window.open(
			data.url ?? callbackUrl,
			"Discord Auth",
			`width=${Math.min(800, window.innerWidth)},height=${Math.min(
				600,
				window.innerHeight,
			)}`,
		);
		// router.push(new URL(data.url ?? callbackUrl).pathname);
		// If url contains a hash, the browser does not reload the page. We reload manually
		// if (data.url.includes("#")) window.location.reload();
		return;
	}

	return res;
}

/**
 * Signs the user out, by removing the session cookie.
 * Automatically adds the CSRF token to the request.
 *
 * [Documentation](https://authjs.dev/reference/sveltekit/client#signout)
 */
export async function signOut(options?: SignOutParams) {
	const { callbackUrl = window.location.href } = options ?? {};
	const basePath = base ?? "";
	// TODO: Remove this since Sveltekit offers the CSRF protection via origin check
	const csrfTokenResponse = await fetch(`${basePath}/auth/csrf`, {
		credentials: "include",
	});
	const { csrfToken } = await csrfTokenResponse.json();
	const res = await fetch(`${basePath}/auth/signout`, {
		method: "post",
		credentials: "include",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			"X-Auth-Return-Redirect": "1",
		},
		body: new URLSearchParams({
			csrfToken,
			callbackUrl,
		}),
	});
	const data = await res.json();

	const url = data.url ?? callbackUrl;
	// window.location.href = url;
	// If url contains a hash, the browser does not reload the page. We reload manually
	// if (url.includes("#")) window.location.reload();
}
