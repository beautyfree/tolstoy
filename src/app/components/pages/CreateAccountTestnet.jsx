import React from 'react';
import LoadingIndicator from 'app/components/elements/LoadingIndicator';
import {PrivateKey} from 'golos-js/lib/auth/ecc';
import {validate_account_name} from 'app/utils/ChainValidation';
import runTests from 'app/utils/BrowserTests';
import GeneratedPasswordInput from 'app/components/elements/GeneratedPasswordInput';
import { APP_DOMAIN, SUPPORT_EMAIL } from 'app/client_config';
import tt from 'counterpart';
import {api, broadcast} from 'golos-js';

class CreateAccountTestnet extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            name: '',
            password: '',
            password_valid: '',
            name_error: '',
            server_error: '',
            loading: false,
            cryptographyFailure: false,
            showRules: false
        };
        this.onSubmit = this.onSubmit.bind(this);
        this.onNameChange = this.onNameChange.bind(this);
        this.onPasswordChange = this.onPasswordChange.bind(this);
    }

    componentDidMount() {
        const cryptoTestResult = runTests();
        if (cryptoTestResult !== undefined) {
            console.error('CreateAccount - cryptoTestResult: ', cryptoTestResult);
            this.setState({cryptographyFailure: true}); // TODO: do not use setState in componentDidMount
        }
    }

    onSubmit(e) {
        e.preventDefault();
        this.setState({server_error: '', loading: true});
        const {name, password, password_valid} = this.state;
        if (!name || !password || !password_valid) return;

        let public_keys;
        try {
            const pk = PrivateKey.fromWif(password);
            public_keys = [1, 2, 3, 4].map(() => pk.toPublicKey().toString());
        } catch (error) {
            public_keys = ['owner', 'active', 'posting', 'memo'].map(role => {
                const pk = PrivateKey.fromSeed(`${name}${role}${password}`);
                return pk.toPublicKey().toString();
            });
        }

        // createAccount
        fetch('/api/v1/create_account_testnet', {
            method: 'post',
            mode: 'no-cors',
            credentials: 'same-origin',
            headers: {
                Accept: 'application/json',
                'Content-type': 'application/json'
            },
            body: JSON.stringify({
                csrf: $STM_csrf,
                name,
                owner_key: public_keys[0],
                active_key: public_keys[1],
                posting_key: public_keys[2],
                memo_key: public_keys[3]
            })
        }).then(r => r.json()).then(res => {
            if (res.error || res.status !== 'ok') {
                console.error('CreateAccount server error', res.error);
                if (res.error === 'Unauthorized') {
                    window.location = '/enter_email';
                }
                this.setState({server_error: res.error || tt('g.unknown'), loading: false});
            } else {
                window.location = `/login.html#account=${name}&msg=accountcreated`;
            }
        }).catch(error => {
            console.error('Caught CreateAccount server error', error);
            this.setState({server_error: (error.message ? error.message : error), loading: false});
        });
    }

    onPasswordChange(password, password_valid) {
        this.setState({password, password_valid});
    }

    onNameChange(e) {
        const name = e.target.value.trim().toLowerCase();
        this.validateAccountName(name);
        this.setState({name});
    }

    validateAccountName(name) {
        let name_error = '';
        let promise;
        if (name.length > 0) {
            name_error = validate_account_name(name);
            if (!name_error) {
                promise = api.getAccountsAsync([name]).then(res => {
                    return res && res.length > 0 ? tt('postfull_jsx.account_name_is_not_available') : '';
                });
            }
        }
        if (promise) {
            promise
                .then(name_error => this.setState({name_error}))
                .catch(() => this.setState({
                    name_error: "Account name can't be verified right now due to server failure. Please try again later."
                }));
        } else {
            this.setState({name_error});
        }
    }

    render() {
        if (!process.env.BROWSER) { // don't render this page on the server
            return <div className="row">
                <div className="column">
                    {tt('g.loading')}...
                </div>
            </div>;
        }

        const APP_NAME = tt('g.APP_NAME');

        const {
            name, password_valid, showPasswordString,
            name_error, server_error, loading, cryptographyFailure, showRules, nameCost
        } = this.state;

        const submit_btn_disabled =
            loading ||
            !name ||
            !password_valid ||
            name_error;
        const submit_btn_class = 'button action' + (submit_btn_disabled ? ' disabled' : '');

        if (cryptographyFailure) {
            return <div className="row">
                <div className="column">
                    <div className="callout alert">
                        <h4>{tt('createaccount_jsx.ctyptography_test_failed')}</h4>
                        <p>{tt('createaccount_jsx.we_will_be_unable_to_create_account_with_this_browser', {APP_NAME})}.</p>
                        <p>
                            {tt('loginform_jsx.the_latest_versions_of') + ' '}
                            <a href="https://www.google.com/chrome/">Chrome</a>
                            {' ' + tt('g.and')}
                            <a href="https://www.mozilla.org/en-US/firefox/new/">Firefox</a>
                            {' ' + tt('loginform_jsx.are_well_tested_and_known_to_work_with', {APP_DOMAIN})}
                        </p>
                    </div>
                </div>
            </div>;
        }

        return (
            <div>
                <div className="CreateAccount row">
                    <div className="column" style={{maxWidth: '36rem', margin: '0 auto'}}>
                        <h2>{tt('g.sign_up')}</h2>
                        <hr />
                        <form onSubmit={this.onSubmit} autoComplete="off" noValidate method="post">
                            <div className={name_error ? 'error' : ''}>
                                <label className="uppercase">{tt('g.username')}
                                    <input type="text" name="name" autoComplete="off" onChange={this.onNameChange} value={name} />
                                </label>
                                <p>{name_error}</p>
                            </div>
                            <GeneratedPasswordInput onChange={this.onPasswordChange} disabled={loading} showPasswordString={name.length > 0 && !name_error} />
                            <br />
                            
                            <noscript>
                                <div className="callout alert">
                                    <p>{tt('createaccount_jsx.form_requires_javascript_to_be_enabled')}</p>
                                </div>
                            </noscript>
                            {loading && <LoadingIndicator type="circle" />}
                            <input disabled={submit_btn_disabled} type="submit" className={submit_btn_class + ' uppercase'} value={tt('g.sign_up')} />
                        </form>
                    </div>
                </div>
            </div>
        );
    }
}

module.exports = {
    path: 'create_account',
    component: CreateAccountTestnet
};
