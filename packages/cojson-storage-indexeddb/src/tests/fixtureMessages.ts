export const fixtures = {
  co_zKwG8NyfZ8GXqcjDHY4NS3SbU2m: {
    getContent: ({ after = 0 }: { after?: number }) => ({
      action: "content",
      id: "co_zKwG8NyfZ8GXqcjDHY4NS3SbU2m",
      header: {
        type: "comap",
        ruleset: {
          type: "group",
          initialAdmin:
            "sealer_zRKetKBH6tdGP8poA2rV9JDejXqTyAmpusCT4jRcXa4m/signer_z6bcctDRiWxtgmuqLRR6rVhM54DA3xJ2pWCEs6DVf4PSy",
        },
        meta: {
          type: "account",
        },
        createdAt: null,
        uniqueness: null,
      },
      new: {
        "sealer_zRKetKBH6tdGP8poA2rV9JDejXqTyAmpusCT4jRcXa4m/signer_z6bcctDRiWxtgmuqLRR6rVhM54DA3xJ2pWCEs6DVf4PSy_session_zbcBS6rHy8kA":
          {
            after,
            lastSignature:
              "signature_z2kcFHUPe1qGFYDY4ayvvFR2unFc4jeYph93nSCSjZYS14vnGN4uAw7pKZx1PEhwnspJcDizMRbLaFC8v13i6S79A",
            newTransactions: [
              {
                privacy: "trusting",
                madeAt: 1732368535089,
                changes:
                  '[{"key":"sealer_zRKetKBH6tdGP8poA2rV9JDejXqTyAmpusCT4jRcXa4m/signer_z6bcctDRiWxtgmuqLRR6rVhM54DA3xJ2pWCEs6DVf4PSy","op":"set","value":"admin"}]',
              },
              {
                privacy: "trusting",
                madeAt: 1732368535096,
                changes:
                  '[{"key":"key_z2YMuLXEfXG44Z2jGk_for_sealer_zRKetKBH6tdGP8poA2rV9JDejXqTyAmpusCT4jRcXa4m/signer_z6bcctDRiWxtgmuqLRR6rVhM54DA3xJ2pWCEs6DVf4PSy","op":"set","value":"sealed_UAIpJTby8EovZW6WPtAqdaczA2_r6PEWRBuEtLN93-Dh9xDJFaGUNTXK1Cck61tjvA3GoGn9EyQdNN2fU6tnmWP2M09a83dG41Q=="}]',
              },
              {
                privacy: "trusting",
                madeAt: 1732368535099,
                changes:
                  '[{"key":"readKey","op":"set","value":"key_z2YMuLXEfXG44Z2jGk"}]',
              },
            ],
          },
        "sealer_zRKetKBH6tdGP8poA2rV9JDejXqTyAmpusCT4jRcXa4m/signer_z6bcctDRiWxtgmuqLRR6rVhM54DA3xJ2pWCEs6DVf4PSy_session_zXgW54i2cCNA":
          {
            after,
            lastSignature:
              "signature_z5FsinkJCpqZfozVBkEMSchCQarsAjvMYpWN4d227PZtqCiM7KRBNukND3B25Q73idBLdY2MsghbmYFz5JHXk3d4D",
            newTransactions: [
              {
                privacy: "trusting",
                madeAt: 1732368535113,
                changes:
                  '[{"key":"profile","op":"set","value":"co_zMKhQJs5rAeGjta3JX2qEdBS6hS"}]',
              },
            ],
          },
      },
      priority: 0,
    }),
    known: {
      action: "known",
      id: "co_zKwG8NyfZ8GXqcjDHY4NS3SbU2m",
      header: true,
      sessions: {
        "sealer_zRKetKBH6tdGP8poA2rV9JDejXqTyAmpusCT4jRcXa4m/signer_z6bcctDRiWxtgmuqLRR6rVhM54DA3xJ2pWCEs6DVf4PSy_session_zbcBS6rHy8kA": 3,
        "sealer_zRKetKBH6tdGP8poA2rV9JDejXqTyAmpusCT4jRcXa4m/signer_z6bcctDRiWxtgmuqLRR6rVhM54DA3xJ2pWCEs6DVf4PSy_session_zXgW54i2cCNA": 1,
      },
    },
    sessionRecords: [
      {
        bytesSinceLastSignature: 479,
        coValue: 2,
        lastIdx: 3,
        lastSignature:
          "signature_z2kcFHUPe1qGFYDY4ayvvFR2unFc4jeYph93nSCSjZYS14vnGN4uAw7pKZx1PEhwnspJcDizMRbLaFC8v13i6S79A",
        rowID: 2,
        sessionID:
          "sealer_zRKetKBH6tdGP8poA2rV9JDejXqTyAmpusCT4jRcXa4m/signer_z6bcctDRiWxtgmuqLRR6rVhM54DA3xJ2pWCEs6DVf4PSy_session_zbcBS6rHy8kA",
      },
      {
        bytesSinceLastSignature: 71,
        coValue: 2,
        lastIdx: 1,
        lastSignature:
          "signature_z5FsinkJCpqZfozVBkEMSchCQarsAjvMYpWN4d227PZtqCiM7KRBNukND3B25Q73idBLdY2MsghbmYFz5JHXk3d4D",
        rowID: 3,
        sessionID:
          "sealer_zRKetKBH6tdGP8poA2rV9JDejXqTyAmpusCT4jRcXa4m/signer_z6bcctDRiWxtgmuqLRR6rVhM54DA3xJ2pWCEs6DVf4PSy_session_zXgW54i2cCNA",
      },
    ],
  },
};
