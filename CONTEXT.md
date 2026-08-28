# Mahjong Scorekeeper

This context defines the domain language for Hong Kong-style Mahjong scorekeeping. It captures scoring and table-state terms only, not implementation or deployment details.

## Language

**Hong Kong-style Mahjong**:
The family of Mahjong rules this app supports, with table-selected house-rule variations for payment splits and bao handling.
_Avoid_: Cantonese/Hong Kong-style Mahjong, generic Mahjong

**Hand**:
One recorded Mahjong outcome: a self-drawn win, a discard win, or a tie.
_Avoid_: Game, round

**Point Value**:
The payment amount associated with a faan count and win type before multiplying it across self-draw payers or splitting it across shared-gun payers.
_Avoid_: Points when the table lookup value needs to be distinguished from score changes

**Full Gun**:
A discard-win payment variation where only the discarder pays the full discard point value to the winner.

**Shared Gun**:
A discard-win payment variation where the discarder pays half of the discard point value and the two other losing players each pay a quarter.
_Avoid_: Half Gun

**Dealer Rotation**:
The app's table-state rule where the dealer stays after winning and advances after a non-dealer win or tie. After each player has become dealer within a prevailing wind, the prevailing wind advances.

**Bao**:
A liability rule where one player is responsible for paying the winner on behalf of multiple players.
_Avoid_: Bao Liability

**Bao Self-Draw**:
A bao case where one bao payer pays all three losing shares for an eligible self-drawn win.

**Bao Payer**:
The player assigned bao responsibility for the hand.
_Avoid_: Pay-all payer
