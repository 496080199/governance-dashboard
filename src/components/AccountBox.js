import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { connect } from 'react-redux';
import jazzicon from 'jazzicon';

import ClickOutside from './ClickOutside';
import Loader from './Loader';
import { cutMiddle } from '../utils/misc';
import { numberForAddress } from '../utils/ethereum';
import arrow from '../imgs/arrow.svg';
import { fonts, colors, shadows } from '../theme';
import { getActiveAccount, setActiveAccount } from '../reducers/accounts';
import { modalOpen } from '../reducers/modal';
import AddressSelection from './modals/AddressSelection';
import PathSelection from './modals/PathSelection';
import { AccountTypes } from '../utils/constants';
import intl from 'react-intl-universal';

const StyledArrow = styled.img`
  margin-left: 0.7em;
  position: relative;
  top: 1px;
  cursor: pointer;
  width: 14px;
  height: 14px;
  mask: url(${arrow}) center no-repeat;
  mask-size: 90%;
  background-color: #627685;
`;

const Account = styled.div`
  margin-left: 9px;
  white-space: nowrap;
  margin: ${({ noAccounts }) => (noAccounts ? 'auto' : '')};
`;

const DropdownList = styled.div`
  min-width: 70px;
  border-radius: 4px;
  font-size: ${fonts.size.small};
  font-weight: ${fonts.weight.medium};
  text-align: center;
  outline: none;
  position: absolute;
  background: rgb(${colors.dark});
  color: rgb(${colors.dark_grey});
  width: 230px;
  top: 110%;
  right: 0;
  z-index: 1;
  opacity: ${({ show }) => (show ? 1 : 0)};
  visibility: ${({ show }) => (show ? 'visible' : 'hidden')};
  pointer-events: ${({ show }) => (show ? 'auto' : 'none')};
  box-shadow: ${shadows.medium};
  overflow-x: hidden;
  overflow-y: auto;
`;

const SelectedItem = styled.div`
  color: ${({ theme, darkText }) =>
    darkText ? '#2A2A2A' : theme.text.header_dim};
  cursor: pointer;
  padding: 6px 10px;
  font-size: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 242px;
  font-weight: ${fonts.weight.normal};
  font-family: ${fonts.family.System};
`;

const Wrapper = styled.div`
  position: relative;
`;

const AccountBlurbWrapper = styled.div`
  display: flex;
  align-items: center;
`;

const typeNames = {
  ledger: 'Ledger',
  trezor: 'Trezor',
  browser: 'Metamask',
  provider: 'Metamask'
};

export class AccountBlurb extends Component {
  constructor(props) {
    super(props);
    this.jazzicon = React.createRef();
  }
  componentDidMount() {
    const _jazzicon = jazzicon(22, numberForAddress(this.props.address));
    this.jazzicon.current.appendChild(_jazzicon);
  }
  componentDidUpdate(prevProps) {
    if (prevProps.address !== this.props.address) {
      const _jazzicon = jazzicon(22, numberForAddress(this.props.address));
      this.jazzicon.current.removeChild(this.jazzicon.current.firstChild);
      this.jazzicon.current.appendChild(_jazzicon);
    }
  }
  render() {
    const { type, address, noAddressCut } = this.props;
    return (
      <AccountBlurbWrapper>
        <div style={{ display: 'flex' }} ref={this.jazzicon} />
        <Account>
          {typeNames[type]} {noAddressCut ? address : cutMiddle(address)}
        </Account>
      </AccountBlurbWrapper>
    );
  }
}

const DropdownRow = styled.div`
  display: flex;
  cursor: pointer;
  justify-content: flex-start;
  font-weight: ${({ selected }) =>
    selected ? fonts.weight.bold : fonts.weight.normal};
  padding: 6px;
  width: auto;
  font-size: 15px;
  padding-left: 11px;
  color: black;
  background: rgb(246, 248, 249);
  &:hover {
    opacity: 0.9;
  }
`;

const DropdownRowForLink = styled(DropdownRow)`
  padding: 0;
`;

const ConnectLink = styled.a`
  color: black;
  padding: 6px;
  display: block;
  width: 100%;
`;

class AccountBox extends Component {
  state = {
    dropdownOpen: false
  };
  clickOutside = () => {
    if (this.state.dropdownOpen) this.setState({ dropdownOpen: false });
  };
  onChange = ({ address }) => {
    this.setState({ dropdownOpen: false });
    this.props.setActiveAccount(address);
  };
  toggleDropdown = () => {
    this.setState(state => ({ dropdownOpen: !state.dropdownOpen }));
  };
  render() {
    const {
      allAccounts,
      activeAccount,
      fetching,
      darkText,
      modalOpen
    } = this.props;

    if (fetching)
      return (
        <SelectedItem>
          <Loader size={20} color="background" background="header" />
        </SelectedItem>
      );

    const availableAccounts = allAccounts.filter(account => !!account.address);

    return (
      <ClickOutside onOutsideClick={this.clickOutside}>
        <Wrapper>
          <SelectedItem onClick={this.toggleDropdown} darkText={darkText}>
            {activeAccount ? (
              <AccountBlurb
                type={activeAccount.type}
                address={activeAccount.address}
              />
            ) : (
              <Account noAccounts>{intl.get('No Accounts')}</Account>
            )}
            <StyledArrow />
          </SelectedItem>
          <DropdownList show={this.state.dropdownOpen}>
            {availableAccounts.map(({ address, type }, i) => (
              <DropdownRow
                key={address}
                onClick={() => this.onChange({ address, type })}
                selected={activeAccount && address === activeAccount.address}
                top={i === 0}
              >
                <AccountBlurb type={type} address={address} />
              </DropdownRow>
            ))}
            <DropdownRowForLink>
              <ConnectLink
                onClick={() => {
                  modalOpen(AddressSelection, {
                    accountType: AccountTypes.TREZOR
                  });
                }}
              >
                {intl.get('Connect to Trezor')}
              </ConnectLink>
            </DropdownRowForLink>
            <DropdownRowForLink>
              <ConnectLink onClick={() => modalOpen(PathSelection)}>
                {intl.get('Connect to Ledger')}
              </ConnectLink>
            </DropdownRowForLink>
          </DropdownList>
        </Wrapper>
      </ClickOutside>
    );
  }
}

AccountBox.propTypes = {
  allAccounts: PropTypes.array,
  fetching: PropTypes.bool,
  setActiveAccount: PropTypes.func,
  darkText: PropTypes.bool
};

AccountBox.defaultProps = {
  allAccounts: [],
  onChange: () => {},
  fetching: false,
  darkText: false
};

const mapStateToProps = ({ accounts }, props) => ({
  allAccounts: accounts.allAccounts,
  activeAccount: getActiveAccount({ accounts }),
  fetching: props.fetching ? true : accounts.fetching
});

export default connect(mapStateToProps, { setActiveAccount, modalOpen })(
  AccountBox
);
