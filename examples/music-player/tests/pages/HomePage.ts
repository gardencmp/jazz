import { Page, expect } from "@playwright/test";

export class HomePage {
  constructor(public page: Page) {}

  newPlaylistButton = this.page.getByRole("button", {
    name: "New Playlist",
  });

  playlistTitleInput = this.page.getByRole("textbox", {
    name: "Playlist title",
  });

  logoutButton = this.page.getByRole("button", {
    name: "Logout",
  });

  async expectActiveTrackPlaying() {
    await expect(
      this.page.getByRole("button", {
        name: `Pause active track`,
      }),
    ).toBeVisible({
      timeout: 10_000,
    });
  }

  async expectMusicTrack(trackName: string) {
    await expect(
      this.page.getByRole("button", {
        name: `Play ${trackName}`,
      }),
    ).toBeVisible();
  }

  async playMusicTrack(trackName: string) {
    await this.page
      .getByRole("button", {
        name: `Play ${trackName}`,
      })
      .click();
  }

  async editTrackTitle(trackTitle: string, newTitle: string) {
    await this.page
      .getByRole("textbox", {
        name: `Edit track title: ${trackTitle}`,
      })
      .fill(newTitle);
  }

  async createPlaylist() {
    await this.newPlaylistButton.click();
  }

  async editPlaylistTitle(playlistTitle: string) {
    await this.playlistTitleInput.fill(playlistTitle);
  }

  async navigateToPlaylist(playlistTitle: string) {
    await this.page
      .getByRole("link", {
        name: playlistTitle,
      })
      .click();
  }

  async getShareLink() {
    await this.page
      .getByRole("button", {
        name: "Share playlist",
      })
      .click();

    const inviteUrl = await this.page.evaluate(() =>
      navigator.clipboard.readText(),
    );

    expect(inviteUrl).toBeTruthy();

    return inviteUrl;
  }

  async addTrackToPlaylist(trackTitle: string, playlistTitle: string) {
    await this.page
      .getByRole("button", {
        name: `Open ${trackTitle} menu`,
      })
      .click();

    await this.page
      .getByRole("menuitem", {
        name: `Add to ${playlistTitle}`,
      })
      .click();
  }

  async logout() {
    await this.logoutButton.click();
  }
}
