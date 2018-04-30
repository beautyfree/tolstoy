import React from 'react';
import {connect} from 'react-redux'
import { Link } from 'react-router';
import TimeAgoWrapper from 'app/components/elements/TimeAgoWrapper';
import Tooltip from 'app/components/elements/Tooltip';
import Memo from 'app/components/elements/Memo'
import {numberWithCommas, vestsToSp} from 'app/utils/StateFunctions'
import tt from 'counterpart';
import { VEST_TICKER, LIQUID_TICKER, DEBT_TOKEN_SHORT } from 'app/client_config';

class TransferHistoryRow extends React.Component {

    render() {
        const LIQUID_TOKEN = tt('token_names.LIQUID_TOKEN')
        const DEBT_TOKEN = tt('token_names.DEBT_TOKEN')
        const DEBT_TOKENS = tt('token_names.DEBT_TOKENS')
        const VESTING_TOKEN =  tt('token_names.VESTING_TOKEN')
        const VESTING_TOKENS = tt('token_names.VESTING_TOKENS')

        const {op, context, curation_reward, author_reward} = this.props
        // context -> account perspective

        const type = op[1].op[0];
        const data = op[1].op[1];

        /*  all transfers involve up to 2 accounts, context and 1 other. */
        let description_start = ""
        let other_account = null;
        let description_end = "";

        if( type === 'transfer_to_vesting' ) {
            const amount = data.amount && data.amount.split && data.amount.split(' ')[0]
            if( data.from === context ) {
                if( data.to === "" ) {
                    description_start += tt('g.transfer') + data.amount.split(' ')[0] + tt('g.to') + " " + VESTING_TOKEN;
                }
                else {
                    description_start += tt('g.transfer') + data.amount.split(' ')[0] + " " + VESTING_TOKEN + tt('g.to');
                    other_account = data.to;
                }
            }
            else if( data.to === context ) {
                description_start += tt('g.receive') + " " + data.amount.split(' ')[0] + " " + VESTING_TOKEN + tt('g.from');
                other_account = data.from;
            } else {
                description_start += tt('g.transfer') + data.amount.split(' ')[0] + " " + VESTING_TOKEN + tt('g.from') + data.from + tt('g.to');
                other_account = data.to;
            }
        }
        else if(/^transfer$|^transfer_to_savings$|^transfer_from_savings$/.test(type)) {
            // transfer_to_savings
            const fromWhere =
                type === 'transfer_to_savings' ? tt('transferhistoryrow_jsx.to_savings') :
                type === 'transfer_from_savings' ? tt('transferhistoryrow_jsx.from_savings') :
                ''

            // if( data.from === context ) {
            //     description_start += `Transfer ${fromWhere}${data.amount} to `;
            //     other_account = data.to;
            // }
            // else if( data.to === context ) {
            //     description_start += `Receive ${fromWhere}${data.amount} from `;
            //     other_account = data.from;
            // } else {
            //     description_start += `Transfer ${fromWhere}${data.amount} from `;
            //     other_account = data.from;
            //     description_end += " to " + data.to;
            // }
            // if(data.request_id != null)
            //     description_end += ` (request ${data.request_id})`

            const { amount } = data
            if( data.from === context ) {
                description_start += tt('transferhistoryrow_jsx.transfer') + `${fromWhere} ${data.amount}` + tt('g.to');
                other_account = data.to;
            }
            else if( data.to === context ) {
                description_start += tt('g.receive') + `${fromWhere} ${data.amount}` + tt('g.from');
                other_account = data.from;
            } else {
                description_start += tt('g.transfer') + `${fromWhere} ${data.amount}` + tt('g.from');
                other_account = data.from;
                description_end += tt('g.to') + data.to;
            }
            if(data.request_id != null)
                description_end += ` (${tt('g.request')} ${data.request_id})`
        } else if (type === 'cancel_transfer_from_savings') {
            description_start += `${tt('transferhistoryrow_jsx.cancel_transfer_from_savings')} (${tt('g.request')} ${data.request_id})`;
        } else if( type === 'withdraw_vesting' ) {
            if( data.vesting_shares === '0.000000 ' + VEST_TICKER)
                description_start += tt('transferhistoryrow_jsx.stop_power_down', {VESTING_TOKENS});
            else
                description_start += tt('transferhistoryrow_jsx.start_power_down_of', {VESTING_TOKENS}) + ' ' +  data.vesting_shares;
        } else if( type === 'curation_reward' ) {
            description_start += `${curation_reward} ${VESTING_TOKENS}` + tt('g.for');
            other_account = data.comment_author + "/" + data.comment_permlink;
        } else if (type === 'author_reward') {
            let steem_payout = ""
            if(data.steem_payout !== '0.000 ' + LIQUID_TICKER) steem_payout = ", " + data.steem_payout;
            description_start += `${renameToSd(data.sbd_payout)}${steem_payout}, ${tt('g.and')} ${author_reward} ${VESTING_TOKENS} ${tt('g.for')} ${data.author}/${data.permlink}`;
            // other_account = ``;
            description_end = '';
        } else if (type === 'interest') {
            description_start += `${tt('transferhistoryrow_jsx.receive_interest_of')} ${data.interest}`;
        } else if (type === 'fill_convert_request') {
            description_start += `Fill convert request: ${data.amount_in} for ${data.amount_out}`;
        } else if (type === 'fill_order') {
            if(data.open_owner == context) {
                // my order was filled by data.current_owner
                description_start += `Paid ${data.open_pays} for ${data.current_pays}`;
            } else {
                // data.open_owner filled my order
                description_start += `Paid ${data.current_pays} for ${data.open_pays}`;
            }
        } else {
            description_start += JSON.stringify({type, ...data}, null, 2);
        }
                            // <Icon name="clock" className="space-right" />
        return(
                <tr key={op[0]} className="Trans">
                    <td>
                        <Tooltip t={new Date(op[1].timestamp).toLocaleString()}>
                            <TimeAgoWrapper date={op[1].timestamp} />
                        </Tooltip>
                    </td>
                    <td className="TransferHistoryRow__text" style={{maxWidth: "40rem"}}>
                        {description_start}
                        {other_account && <Link to={`/@${other_account}`}>{other_account}</Link>}
                        {description_end}
                    </td>
                    <td className="show-for-medium" style={{maxWidth: "40rem", wordWrap: "break-word"}}>
                        <Memo text={data.memo} data={data} username={context} />
                    </td>
                </tr>
        );
    }
}

const renameToSd = txt => txt ? numberWithCommas(txt.replace('SBD', DEBT_TOKEN_SHORT)) : txt

export default connect(
    // mapStateToProps
    (state, ownProps) => {
        const op = ownProps.op
        const type = op[1].op[0]
        const data = op[1].op[1]
        const curation_reward = type === 'curation_reward' ? numberWithCommas(vestsToSp(state, data.reward)) : undefined
        const author_reward = type === 'author_reward' ? numberWithCommas(vestsToSp(state, data.vesting_payout)) : undefined
        return {
            ...ownProps,
            curation_reward,
            author_reward,
        }
    },
)(TransferHistoryRow)
