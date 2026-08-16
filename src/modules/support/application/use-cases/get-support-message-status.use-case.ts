import { Inject, Injectable } from "@nestjs/common";
import {
  SUPPORT_MESSAGE_REPOSITORY,
  type SupportMessageRepositoryPort,
} from "@/modules/support/application/ports/support-message-repository.port";
import { SupportDayBoundaryService } from "@/modules/support/domain/services/support-day-boundary.service";

export interface SupportMessageStatusView {
  canSend: boolean;
  nextAllowedAt: Date | null;
}

@Injectable()
export class GetSupportMessageStatusUseCase {
  constructor(
    @Inject(SUPPORT_MESSAGE_REPOSITORY)
    private readonly supportMessageRepository: SupportMessageRepositoryPort,
  ) {}

  async execute(idUsers: string): Promise<SupportMessageStatusView> {
    const now = new Date();
    const alreadySentToday =
      await this.supportMessageRepository.hasMessageSince(
        idUsers,
        SupportDayBoundaryService.startOfTodayInSaoPaulo(now),
      );

    if (!alreadySentToday) {
      return { canSend: true, nextAllowedAt: null };
    }

    return {
      canSend: false,
      nextAllowedAt: SupportDayBoundaryService.startOfTomorrowInSaoPaulo(now),
    };
  }
}
