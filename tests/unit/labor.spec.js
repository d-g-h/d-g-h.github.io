import { shallowMount } from '@vue/test-utils'
import Labor from '@/components/Labor.vue'

describe('Labor.vue', () => {
  it('renders props.title when passed', () => {
    const title = 'title';
    const wrapper = shallowMount(Labor, {
      props: { title }
    })
    expect(wrapper.text()).toMatch(title)
  });

  it('renders props.location when passed', () => {
    const location = 'location';
    const wrapper = shallowMount(Labor, {
      props: { location }
    })
    expect(wrapper.text()).toMatch(location)
  });

  it('renders props.company when passed', () => {
    const company = 'company';
    const wrapper = shallowMount(Labor, {
      props: { company }
    })
    expect(wrapper.text()).toMatch(company)
  });

  it('renders props.time when passed', () => {
    const time = 'time';
    const wrapper = shallowMount(Labor, {
      props: { time }
    })
    expect(wrapper.text()).toMatch(time)
  });
})
