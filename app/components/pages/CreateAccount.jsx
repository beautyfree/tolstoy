/* eslint react/prop-types: 0 */
import React from 'react';
import { connect } from 'react-redux';
import LoadingIndicator from 'app/components/elements/LoadingIndicator';
import {PrivateKey} from 'golos-js/lib/auth/ecc';
import user from 'app/redux/User';
import {validate_account_name} from 'app/utils/ChainValidation';
import SignUp from 'app/components/modules/SignUp';
import runTests from 'app/utils/BrowserTests';
import g from 'app/redux/GlobalReducer';
import GeneratedPasswordInput from 'app/components/elements/GeneratedPasswordInput';
import CountryCode from "app/components/elements/CountryCode";
import { APP_DOMAIN, SUPPORT_EMAIL } from 'app/client_config';
import tt from 'counterpart';
import {api} from 'golos-js';
import SignupProgressBar from 'app/components/elements/SignupProgressBar';

class CreateAccount extends React.Component {

    static propTypes = {
        loginUser: React.PropTypes.func.isRequired,
        serverBusy: React.PropTypes.bool
    };

    constructor(props) {
        super(props);
        this.state = {
            rnd_verification: Math.round(Math.random() * 15 + 5),
            phone: '',
            country: 0,
            name: '',
            password: '',
            password_valid: '',
            name_error: '',
            phone_hint: '',
            phone_error: '',
            server_error: '',
            loading: false,
            phoneOk: false,
            phoneChecking: false,
            cryptographyFailure: false,
            showRules: false,
            showMobileRules: false,
            allBoxChecked: false
        };
        this.onSubmit = this.onSubmit.bind(this);
        this.onMobileChange = this.onMobileChange.bind(this);
        this.onNameChange = this.onNameChange.bind(this);
        this.onPasswordChange = this.onPasswordChange.bind(this);
        this.onClickSendCode = this.onClickSendCode.bind(this);
    }

    componentDidMount() {
        const cryptoTestResult = runTests();
        if (cryptoTestResult !== undefined) {
            console.error('CreateAccount - cryptoTestResult: ', cryptoTestResult);
            this.setState({cryptographyFailure: true}); // TODO: do not use setState in componentDidMount
        }
        this.validateMobilePhone();
        // Facebook Pixel events #200
        //if (process.env.BROWSER) fbq('track', 'Lead');
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
        fetch('/api/v1/accounts', {
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
                    // window.location = '/enter_email';
                }
                this.setState({server_error: res.error || tt('g.unknown'), loading: false});
            } else {
                window.location = `/login.html#account=${name}&msg=accountcreated`;
                // this.props.loginUser(name, password);
                // const redirect_page = localStorage.getItem('redirect');
                // if (redirect_page) {
                //     localStorage.removeItem('redirect');
                //     browserHistory.push(redirect_page);
                // }
                // else {
                //     browserHistory.push('/@' + name);
                // }
            }
        }).catch(error => {
            console.error('Caught CreateAccount server error', error);
            this.setState({server_error: (error.message ? error.message : error), loading: false});
        });
    }

    onPasswordChange(password, password_valid, allBoxChecked) {
        this.setState({password, password_valid, allBoxChecked});
    }

    onMobileChange(e) {
        const phone = e.target.value.trim().toLowerCase();
        this.validateMobilePhone(phone);
        this.setState({phone});
    }

    validateMobilePhone(value) {
      let phone_error = '';
      let phone_hint = '';
      if (value == null || value.length === 0) {
        phone_error = tt('mobilevalidation_js.not_be_empty');
      }
      else if (!/^[0-9]{1,45}$/.test(value)) {
        phone_error = tt('mobilevalidation_js.have_only_digits');
      }
      else if (value.length < 7) {
        phone_error = tt('mobilevalidation_js.be_longer');
      }

      if (phone_error.length) {
        phone_error = tt('createaccount_jsx.phone_number') + " " + phone_error;
      }
      else {
        phone_hint = '';
      }
      this.setState({phone_error, phone_hint});
    }

    onClickSendCode(e) {
        // fetch
        // this.setState({phoneChecking: true});
        // setTimeout(function () {
        //   this.setState({phoneOk: true});
        // }.bind(this), Math.round(Math.random() * 5 + 5)*1000)
        // createAccount
        const {phone, country} = this.state
        fetch('/send_code', {
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
              country
            })
        // }).then(r => r.json()).then(res => {
        }).then(res => {
            console.log(res.body);
          // if (res.error || res.status !== 'ok') {
          //     console.error('CreateAccount server error', res.error);
          //     if (res.error === 'Unauthorized') {
          //         window.location = '/enter_email';
          //     }
          //     this.setState({server_error: res.error || tt('g.unknown'), loading: false});
          // } else {
          //     window.location = `/login.html#account=${name}&msg=accountcreated`;
          // }
      }).catch(error => {
          console.error('Caught /send_code server error', error);
          // console.error('Caught CreateAccount server error', error);
          // this.setState({server_error: (error.message ? error.message : error), loading: false});
      });
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
            phone, country, name, password_valid, showPasswordString,
            name_error, phone_hint, phone_error, server_error, loading, phoneOk, phoneChecking, cryptographyFailure, showRules, showMobileRules, allBoxChecked
        } = this.state;

        const {loggedIn, logout, offchainUser, serverBusy} = this.props;
        const submit_btn_disabled =
              loading ||
            ! name ||
              name_error ||
            ! password_valid ||
            ! allBoxChecked ||
            ! password_valid ||
            ! phoneOk;
        const submit_btn_class = 'button action' + (submit_btn_disabled ? ' disabled' : '');

        if (serverBusy || $STM_Config.disable_signups) {
            return <div className="row">
                <div className="column">
                    <div className="callout alert">
                        <p>{tt('g.membership_invitation_only', {APP_DOMAIN})}</p>
                    </div>
                </div>
            </div>;
        }
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
        // if (!offchainUser) {
        //     return <SignUp />;
        // }
console.log('loggedIn', loggedIn)
        if (loggedIn) {
            return <div className="row">
                <div className="column">
                    <div className="callout alert">
                        <p>
                          {tt('createaccount_jsx.you_need_to')}
                          <a href="#" onClick={logout}>{tt('g.logout')}</a>
                          {tt('createaccount_jsx.before_creating_account')}
                        </p>
                        <p>
                          {tt('createaccount_jsx.APP_NAME_can_only_register_one_account_per_verified_user', {APP_NAME})}
                        </p>
                    </div>
                </div>
            </div>;
        }

        const existingUserAccount = offchainUser ? offchainUser.get('account') : null;
        if (existingUserAccount) {
            return <div className="row">
                <div className="column">
                    <div className="callout alert">
                        <p>{tt('createaccount_jsx.our_records_indicate_you_already_have_account', {APP_NAME})}: <strong>{existingUserAccount}</strong></p>
                        <p>{tt('createaccount_jsx.in_order_to_prevent_abuse_APP_NAME_can_only_register_one_account_per_user', {APP_NAME})}</p>
                        <p>
                            {tt('createaccount_jsx.next_3_blocks.you_can_either') + ' '}
                            <a href="/login.html">{tt('g.login')}</a>
                            {tt('createaccount_jsx.next_3_blocks.to_your_existing_account_or') + ' '}
                            <a href={"mailto:" + SUPPORT_EMAIL}>{tt('createaccount_jsx.send_us_email')}</a>
                            {' ' + tt('createaccount_jsx.next_3_blocks.if_you_need_a_new_account')}.
                        </p>
                    </div>
                </div>
            </div>;
        }

        let next_step = null;
        if (server_error) {
            if (server_error === 'Email address is not confirmed') {
                next_step = <div className="callout alert">
                    <a href="/enter_email">{tt('tips_js.confirm_email')}</a>
                </div>;
            } else if (server_error === 'Phone number is not confirmed') {
                next_step = <div className="callout alert">
                    <a href="/enter_mobile">{tt('tips_js.confirm_phone')}</a>
                </div>;
            } else {
                next_step = <div className="callout alert">
                    <strong>{tt('createaccount_jsx.couldnt_create_account_server_returned_error')}:</strong>
                    <p>{server_error}</p>
                </div>;
            }
        }

        return (
            <div>
                <div className="CreateAccount row">
                    <div className="column" style={{maxWidth: '36rem', margin: '0 auto'}}>
                        <h2>{tt('g.sign_up')}</h2>
                        <hr />
                        {showMobileRules ? <div className="CreateAccount__rules">
                            <p>
                                {tt('createaccount_jsx.mobile_description.one', {APP_NAME: tt('g.APP_NAME')})}<br/>
                                {tt('createaccount_jsx.mobile_description.second')}<br/>
                                {tt('createaccount_jsx.mobile_description.fourth')}
                            </p>
                            <div className="text-left">
                                <a className="CreateAccount__rules-button" href="#" onClick={() => this.setState({showMobileRules: false})}>
                                    {tt('g.close')}&nbsp;&uarr;
                                </a>
                            </div>
                            <hr />
                        </div> : <div className="text-left"><p>
                            <a className="CreateAccount__rules-button" href="#" onClick={() => this.setState({showMobileRules: true})}>{tt('createaccount_jsx.why_send_sms')}&nbsp;&darr;</a>
                        </p></div>}
                        {showRules ? <div className="CreateAccount__rules">
                            <p>
                                {tt('g.the_rules_of_APP_NAME.one', {APP_NAME})}<br/>
                                {tt('g.the_rules_of_APP_NAME.second', {APP_NAME})}<br/>
                                {tt('g.the_rules_of_APP_NAME.third', {APP_NAME})}<br/>
                                {tt('g.the_rules_of_APP_NAME.fourth')}<br/>
                                {tt('g.the_rules_of_APP_NAME.fifth')}<br/>
                                {tt('g.the_rules_of_APP_NAME.sixth')}<br/>
                                {tt('g.the_rules_of_APP_NAME.seventh')}
                            </p>
                            <div className="text-left">
                                <a className="CreateAccount__rules-button" href="#" onClick={() => this.setState({showRules: false})}>
                                    {tt('g.close')}&nbsp;&uarr;
                                </a>
                            </div>
                            <hr />
                        </div> : <div className="text-left"><p>
                            <a className="CreateAccount__rules-button" href="#" onClick={() => this.setState({showRules: true})}>{tt('g.show_rules')}&nbsp;&darr;</a>
                        </p></div>}
                        <form onSubmit={this.onSubmit} autoComplete="off" noValidate method="post">
                            <div>
                                <label className="uppercase">
                                    <span style={{color: 'red'}}>*</span> {tt('createaccount_jsx.country_code')}
                                    <CountryCode disabled={phoneChecking} name="country" value={country} />
                                </label><p></p>
                            </div>
                            <div className={(phone_error ? 'error' : '') + (phone_hint ? 'success' : '')}>
                                <label className="uppercase">
                                    <span style={{color: 'red'}}>*</span> {tt('createaccount_jsx.phone_number')} <span style={{color: 'red'}}>{tt('createaccount_jsx.without_country_code')}</span>
                                    <input type="text" name="phone" autoComplete="off" disabled={phoneChecking} onChange={this.onMobileChange} value={phone} />
                                </label>
                                <p>{phone_error || phone_hint}</p>
                                <p><a className={'button holow uppercase ' + (!phone_hint ? 'disabled' : '')} href="">Получить код</a></p>
                            </div>
                            <div className={name_error ? 'error' : ''}>
                                <label className="uppercase">{tt('g.username')}
                                    <input type="text" name="name" autoComplete="off" disabled={! phoneOk} onChange={this.onNameChange} value={name} />
                                </label>
                                <p>{name_error}</p>
                            </div>
                            <GeneratedPasswordInput onChange={this.onPasswordChange} disabled={!phoneOk || loading} showPasswordString={name.length > 0 && !name_error} />
                            <br />
                            {next_step}
                            <noscript>
                                <div className="callout alert">
                                    <p>{tt('createaccount_jsx.form_requires_javascript_to_be_enabled')}</p>
                                </div>
                            </noscript>
                            {loading && <LoadingIndicator type="circle" />}
                            <input disabled={submit_btn_disabled} type="submit" className={submit_btn_class + ' uppercase'} value={tt('g.sign_up')}/>
                        </form>
                    </div>
                </div>
            </div>
        );
    }
}

module.exports = {
    path: 'create_account',
    component: connect(
        state => {
            return {
                loggedIn: !!state.user.get('current'),
                offchainUser: state.offchain.get('user'),
                serverBusy: state.offchain.get('serverBusy'),
                suggestedPassword: state.global.get('suggestedPassword'),
            }
        },
        dispatch => ({
            loginUser: (username, password) => dispatch(user.actions.usernamePasswordLogin({username, password, saveLogin: true})),
            logout: e => {
                if (e) e.preventDefault();
                dispatch(user.actions.logout())
            }
        })
    )(CreateAccount)
};
