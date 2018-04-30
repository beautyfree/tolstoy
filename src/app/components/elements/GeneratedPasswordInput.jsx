import React from 'react';
import { key_utils } from 'golos-js/lib/auth/ecc';
import tt from 'counterpart';
import { APP_NAME, TERMS_OF_SERVICE_URL } from 'app/client_config';

function allChecked(confirmCheckboxes) {
    return confirmCheckboxes.box1 && confirmCheckboxes.box2 && confirmCheckboxes.box3;
}

export default class GeneratedPasswordInput extends React.Component {

    static propTypes = {
        disabled: React.PropTypes.bool,
        onChange: React.PropTypes.func.isRequired,
        showPasswordString: React.PropTypes.bool.isRequired
    };

    constructor(props) {
        super(props);
        this.state = {
            generatedPassword: 'P' + key_utils.get_random_key().toWif(),
            confirmPassword: '',
            confirmPasswordError: '',
            confirmCheckboxes: {box1: false, box2: false, box3: false}
        };
        this.confirmPasswordChange = this.confirmPasswordChange.bind(this);
        this.confirmCheckChange = this.confirmCheckChange.bind(this);
    }

    confirmCheckChange(e) {
        const confirmCheckboxes = this.state.confirmCheckboxes;
        confirmCheckboxes[e.target.name] = e.target.checked;
        this.setState({confirmCheckboxes});
        const {confirmPassword, generatedPassword} = this.state;
        this.props.onChange(confirmPassword, confirmPassword && confirmPassword === generatedPassword, allChecked(confirmCheckboxes));
    }

    confirmPasswordChange(e) {
        const confirmPassword = e.target.value.trim();
        const {generatedPassword, confirmCheckboxes} = this.state;
        let confirmPasswordError = '';
        if (confirmPassword && confirmPassword !== generatedPassword) confirmPasswordError = tt('g.passwords_do_not_match');
        this.setState({confirmPassword, confirmPasswordError});
        this.props.onChange(confirmPassword, confirmPassword && confirmPassword === generatedPassword, allChecked(confirmCheckboxes));
    }

    render() {
        const {disabled, showPasswordString} = this.props;
        const {generatedPassword, confirmPassword, confirmPasswordError, confirmCheckboxes} = this.state;
        return (
            <div className="GeneratedPasswordInput">
                <div className="GeneratedPasswordInput__field">
                    <label className="uppercase">{tt('g.generated_password')}<br />
                        <code className={(disabled ? 'disabled ' : '') + 'GeneratedPasswordInput__generated_password'}>{showPasswordString ? generatedPassword : '-'}</code>
                        <div className="GeneratedPasswordInput__backup_text">
                            {tt('g.backup_password_by_storing_it')}
                        </div>
                    </label>
                </div>
                <div className="GeneratedPasswordInput__field">
                    <label className="uppercase">
                        {tt('g.re_enter_generate_password')}
                        <input type="password" name="confirmPassword" autoComplete="off" onChange={this.confirmPasswordChange} value={confirmPassword} disabled={disabled} />
                    </label>
                    <div className="error">{confirmPasswordError}</div>
                </div>
                <div className="GeneratedPasswordInput__checkboxes">
                    <label><input type="checkbox" name="box1" onChange={this.confirmCheckChange} checked={confirmCheckboxes.box1} disabled={disabled} />
                        {tt('g.understand_that_APP_NAME_cannot_recover_password', {APP_NAME: "GOLOS.io"})}.
                    </label>
                    <label><input type="checkbox" name="box2" onChange={this.confirmCheckChange} checked={confirmCheckboxes.box2} disabled={disabled} />
                        {tt('g.i_saved_password')}.
                    </label>
                    <label><input type="checkbox" name="box3" onChange={this.confirmCheckChange} checked={confirmCheckboxes.box3} disabled={disabled} />
                        {tt('generated_password_input.i_have_read_and_agree_to_the')}&nbsp;
                        <a href={TERMS_OF_SERVICE_URL} target="_blank">{tt('generated_password_input.terms_of_service')}</a>.
                    </label>
                </div>
            </div>
        );
    }
}
