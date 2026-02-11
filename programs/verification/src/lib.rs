use anchor_lang::prelude::*;

declare_id!("BTpbE1Dmu43fX4N7NM2EXTpK9Vq7NnjsdyYUk4MbFLyG");

#[program]
pub mod verification {
    use super::*;

    /// Initialize a new event verification account (PDA).
    /// Authority is the community/guild admin.
    pub fn initialize_event(
        ctx: Context<InitializeEvent>,
        event_id: String,
        max_winners: u32,
        requirements: Vec<Requirement>,
    ) -> Result<()> {
        let event = &mut ctx.accounts.event;
        event.authority = ctx.accounts.authority.key();
        event.event_id = event_id;
        event.max_winners = max_winners;
        event.requirements = requirements;
        event.active = true;
        event.bump = ctx.bumps.event;

        Ok(())
    }

    /// Register wallet ownership for an event entry.
    /// Wallet owner must sign the transaction.
    pub fn register_wallet(
        ctx: Context<RegisterWallet>,
        event_id: String,
    ) -> Result<()> {
        let entry = &mut ctx.accounts.entry;
        entry.event = ctx.accounts.event.key();
        entry.wallet = ctx.accounts.wallet.key();
        entry.verified = true;

        Ok(())
    }

    /// Mark entry as valid (passed all requirements).
    pub fn mark_valid(ctx: Context<MarkValid>) -> Result<()> {
        let entry = &mut ctx.accounts.entry;
        entry.valid = true;

        Ok(())
    }

    /// Mark entry as invalid (failed requirements).
    pub fn mark_invalid(ctx: Context<MarkInvalid>) -> Result<()> {
        let entry = &mut ctx.accounts.entry;
        entry.valid = false;

        Ok(())
    }

    /// Close event (disable new entries, finalize verification).
    pub fn close_event(ctx: Context<CloseEvent>) -> Result<()> {
        let event = &mut ctx.accounts.event;
        event.active = false;

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(event_id: String)]
pub struct InitializeEvent<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + EventState::INIT_SPACE,
        seeds = [b"event", event_id.as_bytes()],
        bump
    )]
    pub event: Account<'info, EventState>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RegisterWallet<'info> {
    #[account(mut)]
    pub wallet: Signer<'info>,

    #[account(mut)]
    pub event: Account<'info, EventState>,

    #[account(
        init,
        payer = wallet,
        space = 8 + EntryState::INIT_SPACE,
        seeds = [b"entry", event.key().as_ref(), wallet.key().as_ref()],
        bump
    )]
    pub entry: Account<'info, EntryState>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MarkValid<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(has_one = authority)]
    pub event: Account<'info, EventState>,

    #[account(mut, constraint = entry.event == event.key())]
    pub entry: Account<'info, EntryState>,
}

#[derive(Accounts)]
pub struct MarkInvalid<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(has_one = authority)]
    pub event: Account<'info, EventState>,

    #[account(mut, constraint = entry.event == event.key())]
    pub entry: Account<'info, EntryState>,
}

#[derive(Accounts)]
pub struct CloseEvent<'info> {
    pub authority: Signer<'info>,

    #[account(mut, has_one = authority)]
    pub event: Account<'info, EventState>,
}

#[account]
pub struct EventState {
    pub authority: Pubkey,
    pub event_id: String,
    pub max_winners: u32,
    pub requirements: Vec<Requirement>,
    pub active: bool,
    pub bump: u8,
}

impl EventState {
    const INIT_SPACE: usize = 32 + (4 + 50) + 4 + (4 + 256) + 1 + 1;
}

#[account]
pub struct EntryState {
    pub event: Pubkey,
    pub wallet: Pubkey,
    pub verified: bool,
    pub valid: bool,
}

impl EntryState {
    const INIT_SPACE: usize = 32 + 32 + 1 + 1;
}

#[derive(Clone, Debug, AnchorSerialize, AnchorDeserialize)]
pub struct Requirement {
    pub requirement_type: String,
    pub config: String,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Event is not active")]
    EventNotActive,

    #[msg("Wallet already registered")]
    WalletAlreadyRegistered,

    #[msg("Invalid authority")]
    InvalidAuthority,
}
