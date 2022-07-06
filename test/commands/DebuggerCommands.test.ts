// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import assert from 'assert';
import path from 'path';
import sinon from 'sinon';
import {debug, QuickPickItem, Uri, workspace} from 'vscode';

import {DebugNetwork} from '@/debugAdapter/debugNetwork';
import {ITransactionResponse} from '@/debugAdapter/models/ITransactionResponse';
import {TransactionProvider} from '@/debugAdapter/transaction/transactionProvider';

import * as userInteraction from '../../src/helpers/userInteraction';
import {TestConstants} from '../TestConstants';

import * as helpers from '../../src/helpers';

const truffleWorkspace: Uri = Uri.parse(path.join(__dirname, TestConstants.truffleCommandTestDataFolder));

describe('DebuggerCommands unit tests', () => {
  let mockGetTxHashes: sinon.SinonStub<[(number | undefined)?], Promise<string[]>>;
  let mockGetTxInfos: sinon.SinonStub<[string[]], Promise<ITransactionResponse[]>>;
  let debugCommands: any;
  let getWorkspacesMock: any;

  beforeEach(() => {
    mockGetTxHashes = sinon.stub(TransactionProvider.prototype, 'getLastTransactionHashes');
    mockGetTxHashes.resolves([]);
    mockGetTxInfos = sinon.stub(TransactionProvider.prototype, 'getTransactionsInfo');
    mockGetTxInfos.resolves([]);

    getWorkspacesMock = sinon.stub(helpers, 'getWorkspace');
    getWorkspacesMock.returns(truffleWorkspace);

    sinon.stub(debug, 'startDebugging').resolves();
    sinon.stub(workspace, 'workspaceFolders').value([{uri: {fsPath: 'workspace'}}]);
    sinon.stub(DebugNetwork.prototype, 'load').resolves();
    sinon
      .stub(DebugNetwork.prototype, 'getTruffleConfiguration')
      .returns({build_directory: '', contracts_build_directory: '', contracts_directory: '', migrations_directory: ''});
    sinon
      .stub(DebugNetwork.prototype, 'getNetwork')
      .returns({name: 'development', options: {host: '127.0.0.1', port: 8545, network_id: '*'}});

    debugCommands = require('../../src/commands/DebuggerCommands');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should generate and show quickPick when debugNetwork.isLocalNetwork() is true', async () => {
    // Arrange
    sinon.stub(DebugNetwork.prototype, 'isLocalNetwork').returns(true);
    const createQuickPickFn = sinon.stub(userInteraction, 'showQuickPick').resolves({} as QuickPickItem);

    // Act
    await debugCommands.DebuggerCommands.startSolidityDebugger();

    // Assert
    assert.strictEqual(mockGetTxHashes.calledOnce, true, 'getLastTransactionHashes should be called');
    assert.strictEqual(mockGetTxInfos.calledOnce, true, 'getTransactionsInfo should be called');
    assert.strictEqual(createQuickPickFn.called, true, 'createQuickPic should be called');
  });

  it('should show inputBox when debugNetwork.isLocalNetwork() is false', async () => {
    // Arrange
    sinon.stub(DebugNetwork.prototype, 'isLocalNetwork').returns(false);
    const showInputBoxFn = sinon.stub(userInteraction, 'showInputBox').resolves('');

    // Act
    await debugCommands.DebuggerCommands.startSolidityDebugger();

    // Assert
    assert.strictEqual(showInputBoxFn.called, true, 'showInputBox should be called');
    assert.strictEqual(mockGetTxHashes.calledOnce, false, "getLastTransactionHashes shouldn't be called");
    assert.strictEqual(mockGetTxInfos.calledOnce, false, "getTransactionsInfo shouldn't be called");
  });
});
