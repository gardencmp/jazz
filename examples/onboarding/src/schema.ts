import {
  Account,
  CoList,
  CoMap,
  ImageDefinition,
  Profile,
  co,
} from "jazz-tools";

type Steps = "initial" | "upload" | "final";

interface Step {
  type: Steps;
  prevStep: ReturnType<typeof co.ref> | undefined;
  done: boolean;

  isCurrentStep(): boolean;
}

export class CoInitialStep extends CoMap implements Step {
  type = "initial" as const;
  ssn? = co.string;
  address? = co.string;
  done = co.boolean;
  prevStep: undefined;

  isCurrentStep() {
    return !this.done;
  }
}

export class CoDocUploadStep extends CoMap implements Step {
  type = "upload" as const;
  prevStep = co.ref(CoInitialStep);
  photo = co.ref(ImageDefinition, { optional: true });
  done = co.boolean;

  isCurrentStep() {
    return !!(this.prevStep?.done && !this.done);
  }
}

export class CoFinalStep extends CoMap implements Step {
  type = "final" as const;
  prevStep = co.ref(CoDocUploadStep);
  done = co.boolean;

  isCurrentStep() {
    return !!(this.prevStep?.done && !this.done);
  }
}

export class CoEmployee extends CoMap {
  name = co.string;
  deleted? = co.boolean;
  initialStep = co.ref(CoInitialStep);
  docUploadStep = co.ref(CoDocUploadStep);
  finalStep = co.ref(CoFinalStep);
}

export class EmployeeCoList extends CoList.Of(co.ref(CoEmployee)) {}

export class HRProfile extends Profile {
  employees = co.ref(EmployeeCoList);
}

export class HRAccount extends Account {
  profile = co.ref(HRProfile)!;

  migrate(this: HRAccount, creationProps?: { name: string }) {
    super.migrate(creationProps);

    if (!this.profile._refs.employees) {
      this.profile.employees = EmployeeCoList.create([], {
        owner: this.profile._owner,
      });
    }
  }
}
