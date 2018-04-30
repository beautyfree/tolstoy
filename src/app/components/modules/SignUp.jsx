import React from 'react';
import {connect} from 'react-redux';
import SvgImage from 'app/components/elements/SvgImage';
import tt from 'counterpart';
import { formatCoins } from 'app/utils/FormatCoins';
import { APP_DOMAIN, PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from 'app/client_config';
import LocalizedCurrency from 'app/components/elements/LocalizedCurrency';

class SignUp extends React.Component {
    constructor() {
        super();
        this.state = {waiting_list: false};
    }
    render() {
        const APP_NAME = tt('g.APP_NAME');
        const VESTING_TOKEN =  tt('token_names.VESTING_TOKEN')

        return <div className="SignUp">
            <div className="row">
                <div className="column">
                    <h3>{tt("g.sign_up")}</h3>
                    <p>
                        {tt("g.we_require_social_account1", {APP_NAME})}
                        <LocalizedCurrency amount={Number(this.props.signup_bonus)} />
                        {tt("g.we_require_social_account2", {VESTING_TOKEN})}
                        <br />
                        {tt("g.personal_info_will_be_private")}
                        {' '}
                        <a href={TERMS_OF_SERVICE_URL} target="_blank">
                            {tt("g.personal_info_will_be_private_link")}
                        </a>.
                    </p>
                </div>
            </div>
            <div className="row">
                <div className="column large-4 shrink">
                    <SvgImage name="golos" width="64px" height="64px" />
                </div>
                <div className="column large-8">
                    <a href="/create_account" className="button secondary">{tt("recoveraccountstep1_jsx.continue_with_email")}</a>
                </div>
            </div>
            <div className="row">
                <div className="column">
                      <br />
                    <p className="secondary">
                        {tt('enter_confirm_email_jsx.next_3_strings.by_verifying_you_agree_with') + ' '}
                        <a href={PRIVACY_POLICY_URL} target="_blank">
                            {tt('enter_confirm_email_jsx.next_3_strings.by_verifying_you_agree_with_privacy_policy')}
                        </a>
                        {' ' + tt('enter_confirm_email_jsx.next_3_strings.by_verifying_you_agree_with_privacy_policy_of_website_APP_DOMAIN', {APP_DOMAIN})}.
                    </p>
                </div>
            </div>
        </div>
    }
}

export default connect(
    state => {
        return {
            signup_bonus: state.offchain.get('signup_bonus'),
            serverBusy: state.offchain.get('serverBusy')
        };
    }
)(SignUp);
