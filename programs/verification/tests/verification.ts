import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { Verification } from '../target/types/verification';
import { expect } from 'chai';

describe('verification', () => {
    // Configure the client to use the local cluster.
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.Verification as Program<Verification>;

    it('should initialize an event', async () => {
        const eventId = 'test-event-001';
        const [eventPda] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from('event'), Buffer.from(eventId)],
            program.programId,
        );

        const tx = await program.methods
            .initializeEvent(eventId, 10, [])
            .accounts({
                authority: provider.wallet.publicKey,
                event: eventPda,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .rpc();

        const eventAccount = await program.account.eventState.fetch(eventPda);
        expect(eventAccount.eventId).to.equal(eventId);
        expect(eventAccount.maxWinners).to.equal(10);
        expect(eventAccount.active).to.be.true;
    });

    it('should register a wallet', async () => {
        const eventId = 'test-event-001';
        const [eventPda] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from('event'), Buffer.from(eventId)],
            program.programId,
        );

        const [entryPda] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from('entry'), eventPda.toBuffer(), provider.wallet.publicKey.toBuffer()],
            program.programId,
        );

        await program.methods
            .registerWallet(eventId)
            .accounts({
                wallet: provider.wallet.publicKey,
                event: eventPda,
                entry: entryPda,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .rpc();

        const entryAccount = await program.account.entryState.fetch(entryPda);
        expect(entryAccount.verified).to.be.true;
    });

    it('should close an event', async () => {
        const eventId = 'test-event-001';
        const [eventPda] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from('event'), Buffer.from(eventId)],
            program.programId,
        );

        await program.methods
            .closeEvent()
            .accounts({
                authority: provider.wallet.publicKey,
                event: eventPda,
            })
            .rpc();

        const eventAccount = await program.account.eventState.fetch(eventPda);
        expect(eventAccount.active).to.be.false;
    });
});
